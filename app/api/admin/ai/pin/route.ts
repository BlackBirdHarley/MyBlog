import { auth } from "@/lib/auth";
import { extractText } from "@/lib/content-renderer";
import { uploadImage } from "@/lib/blob";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import path from "path";
import fs from "fs/promises";
import { z } from "zod";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const requestSchema = z.object({
  articleId: z.string().optional(),
  title: z.string().optional(),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.unknown().optional(),
  prompt: z.string().optional(),
  referenceImageUrl: z.string().optional(),
  mode: z.enum(["pin", "marketing"]).default("pin"),
});

type PinCopy = {
  title: string;
  overlayText: string;
  description: string;
  altText: string;
  tags: string[];
  imagePrompt: string;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const article = parsed.data.articleId
      ? await prisma.article.findUnique({
          where: { id: parsed.data.articleId },
          include: { category: true, tags: true },
        })
      : null;

    const title = article?.title ?? parsed.data.title ?? "";
    const slug = article?.slug ?? parsed.data.slug ?? "";
    const excerpt = article?.excerpt ?? parsed.data.excerpt ?? "";
    const contentText = article?.content
      ? extractText(article.content as object).slice(0, 5000)
      : parsed.data.content
        ? extractText(parsed.data.content as object).slice(0, 5000)
        : "";
    const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    const baseUrl = (settings?.siteUrl || process.env.SITE_URL || req.nextUrl.origin).replace(/\/$/, "");
    const articleUrl = slug ? `${baseUrl || ""}/blog/${slug}` : "";
    const categoryName = article?.category?.name ?? "";
    const tagNames = article?.tags.map((tag) => tag.name).join(", ") ?? "";

    const copy = await generatePinCopy({
      mode: parsed.data.mode,
      title,
      excerpt,
      contentText,
      categoryName,
      tagNames,
      articleUrl,
      userPrompt: parsed.data.prompt ?? "",
      hasReference: Boolean(parsed.data.referenceImageUrl),
    });

    const imagePrompt = buildImagePrompt(copy, parsed.data.mode, parsed.data.prompt ?? "", Boolean(parsed.data.referenceImageUrl));
    const image = await generateImage(imagePrompt, parsed.data.referenceImageUrl);
    const uploaded = await uploadImage(
      new File([image.buffer], image.filename, { type: image.mimeType }),
      "media"
    );

    const media = await prisma.media.create({
      data: {
        filename: uploaded.filename,
        url: uploaded.url,
        altText: copy.altText,
        caption: copy.title,
        fileSize: uploaded.size,
        mimeType: uploaded.mimeType,
      },
    });

    const savedPin = article?.id
      ? await prisma.articlePin.create({
          data: {
            articleId: article.id,
            imageUrl: media.url,
            title: copy.title,
            altText: copy.altText,
            description: stripUrls(copy.description),
            linkUrl: articleUrl,
            taggedTopics: copy.tags,
            sortOrder: await prisma.articlePin.count({ where: { articleId: article.id } }),
          },
        })
      : null;

    return NextResponse.json({
      media,
      pin: {
        id: savedPin?.id,
        imageUrl: media.url,
        altText: copy.altText,
        description: stripUrls(copy.description),
        title: copy.title,
        taggedTopics: copy.tags,
        tags: copy.tags,
        linkUrl: articleUrl,
        articleUrl,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Pin generation failed" },
      { status: 500 }
    );
  }
}

async function generatePinCopy(input: {
  mode: "pin" | "marketing";
  title: string;
  excerpt: string;
  contentText: string;
  categoryName: string;
  tagNames: string;
  articleUrl: string;
  userPrompt: string;
  hasReference: boolean;
}): Promise<PinCopy> {
  const prompt = `You are a Pinterest SEO strategist and art director for a home organization blog.

Return ONLY valid JSON. No markdown.

Mode: ${input.mode}
Article title: ${input.title}
Excerpt: ${input.excerpt}
Category: ${input.categoryName || "none"}
Tags: ${input.tagNames || "none"}
Article URL: ${input.articleUrl || "not available"}
User direction: ${input.userPrompt || "none"}
Reference image provided: ${input.hasReference ? "yes" : "no"}

Article text:
${input.contentText}

Create a Pinterest-ready package:
- title: short click-worthy pin title, max 70 characters.
- overlayText: 2-6 words that can be placed on the image.
- description: 120-220 characters, natural SEO, no URLs and no "visit/read more" link text because the article URL is stored in a separate linkUrl field.
- altText: useful accessibility text for the generated image.
- tags: 5-8 concise Pinterest tags without #.
- imagePrompt: detailed visual prompt for a vertical 2:3 marketing pin. If a reference image is provided, preserve its winning style, layout, color mood, and composition without copying brands or text exactly.

JSON shape:
{"title":"...","overlayText":"...","description":"...","altText":"...","tags":["..."],"imagePrompt":"..."}`;

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_TEXT_MODEL ?? "gpt-4o",
    response_format: { type: "json_object" },
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const data = JSON.parse(raw) as Partial<PinCopy>;
  return {
    title: (data.title || input.title || "Pinterest pin").slice(0, 90),
    overlayText: (data.overlayText || input.title || "Fresh Ideas").slice(0, 60),
    description: stripUrls(data.description || input.excerpt || input.title || ""),
    altText: data.altText || `Pinterest marketing graphic for ${input.title || "article"}`,
    tags: Array.isArray(data.tags) ? data.tags.filter(Boolean).slice(0, 8) : [],
    imagePrompt: data.imagePrompt || input.userPrompt || input.title || "A polished Pinterest marketing graphic",
  };
}

function stripUrls(value: string) {
  return value
    .replace(/\b(?:Visit|Read more|Learn more|See more)\s*:?\s*https?:\/\/\S+/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(?:Visit|Read more|Learn more|See more)(?:\s+at)?\s*:?\s*$/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildImagePrompt(copy: PinCopy, mode: "pin" | "marketing", userPrompt: string, hasReference: boolean) {
  const base = mode === "pin"
    ? "Create a vertical 2:3 Pinterest pin graphic for a home organization blog."
    : "Create a polished marketing image for a home organization article, suitable for Pinterest and social sharing.";

  return `${base}
Visual direction: ${copy.imagePrompt}
Primary overlay text: "${copy.overlayText}"
Pin title context: ${copy.title}
${userPrompt ? `Additional user direction: ${userPrompt}` : ""}
${hasReference ? "Use the uploaded reference as style/product/composition guidance, but generate an original design." : ""}
Design requirements: premium editorial look, bright natural light, clean composition, realistic materials, readable text area, no fake logos, no watermark, no distorted text, no clutter.`;
}

async function generateImage(prompt: string, referenceImageUrl?: string) {
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  const size = "1024x1536" as const;
  const quality = (process.env.OPENAI_IMAGE_QUALITY ?? "medium") as "low" | "medium" | "high" | "auto";
  const outputFormat = "png" as const;

  const response = referenceImageUrl
    ? await client.images.edit({
        model,
        image: await imageUrlToUploadable(referenceImageUrl),
        prompt,
        size,
        quality,
        output_format: outputFormat,
        input_fidelity: "high",
      })
    : await client.images.generate({
        model,
        prompt,
        size,
        quality,
        output_format: outputFormat,
      });

  const image = response.data?.[0];
  if (!image?.b64_json) throw new Error("OpenAI did not return image data");

  return {
    buffer: Buffer.from(image.b64_json, "base64"),
    filename: `ai-pin-${Date.now()}.png`,
    mimeType: "image/png",
  };
}

async function imageUrlToUploadable(url: string) {
  if (url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", url);
    const buffer = await fs.readFile(filePath);
    return toFile(buffer, path.basename(url), { type: contentTypeFromName(url) });
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not read reference image");
  const buffer = Buffer.from(await response.arrayBuffer());
  const name = url.split("/").pop()?.split("?")[0] || "reference-image.png";
  return toFile(buffer, name, { type: response.headers.get("content-type") || contentTypeFromName(name) });
}

function contentTypeFromName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "image/png";
}
