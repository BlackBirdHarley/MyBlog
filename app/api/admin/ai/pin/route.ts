import { auth } from "@/lib/auth";
import { extractText } from "@/lib/content-renderer";
import { originalBlobUrl, uploadImage } from "@/lib/blob";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import path from "path";
import fs from "fs/promises";
import { z } from "zod";
import { get } from "@vercel/blob";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const requestSchema = z.object({
  articleId: z.string().optional(),
  title: z.string().optional(),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.unknown().optional(),
  prompt: z.string().optional(),
  referenceImageUrl: z.string().optional(),
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
  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    const messages = [
      ...formErrors,
      ...Object.entries(fieldErrors).flatMap(([field, errors]) =>
        errors.map((error) => `${field}: ${error}`)
      ),
    ];
    return NextResponse.json(
      { error: messages.join("; ") || "Invalid pin generation request" },
      { status: 400 }
    );
  }

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
      title,
      excerpt,
      contentText,
      categoryName,
      tagNames,
      articleUrl,
      userPrompt: parsed.data.prompt ?? "",
      hasReference: Boolean(parsed.data.referenceImageUrl),
    });

    const imagePrompt = buildImagePrompt(copy, parsed.data.prompt ?? "", Boolean(parsed.data.referenceImageUrl));
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
      ? await prisma.$transaction(async (tx) => {
          const sortOrder = await tx.articlePin.count({ where: { articleId: article.id } });
          return tx.articlePin.create({
            data: {
              articleId: article.id,
              mediaId: media.id,
              imageUrl: media.url,
              title: copy.title,
              altText: copy.altText,
              description: stripUrls(copy.description),
              linkUrl: articleUrl,
              taggedTopics: copy.tags,
              sortOrder,
            },
          });
        })
      : null;
    const pins = article?.id
      ? await prisma.articlePin.findMany({
          where: { articleId: article.id },
          include: { media: true },
          orderBy: { sortOrder: "asc" },
        })
      : [];

    return NextResponse.json({
      media,
      pin: {
        id: savedPin?.id,
        mediaId: media.id,
        imageUrl: media.url,
        altText: copy.altText,
        description: stripUrls(copy.description),
        title: copy.title,
        taggedTopics: copy.tags,
        tags: copy.tags,
        linkUrl: articleUrl,
        articleUrl,
      },
      pins,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Pin generation failed" },
      { status: 500 }
    );
  }
}

async function generatePinCopy(input: {
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
- imagePrompt: detailed visual prompt for a vertical 2:3 marketing pin.
${input.hasReference
  ? "- imagePrompt must describe how to adapt the uploaded reference image as the PRIMARY visual source. Keep the reference's format, main subject type, layout, typography style, color mood, visual hierarchy, and composition. If the reference is a checklist, list, poster, infographic, product photo, or saved Pinterest pin, keep that same visual category. Use article context only for SEO copy and overlay text. Do not invent pantry shelves, bins, jars, or a different scene unless they are visible in the uploaded reference or explicitly requested by the user."
  : "- imagePrompt should create an original visual concept based on the article topic."}

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

function buildImagePrompt(copy: PinCopy, userPrompt: string, hasReference: boolean) {
  if (hasReference) {
    return `Transform the uploaded reference image into a vertical 2:3 Pinterest pin graphic.

Reference priority:
- Treat the uploaded image as the PRIMARY visual source.
- Preserve the reference image's visual category and structure. If it is a checklist/list/poster/infographic, keep it as a checklist/list/poster/infographic. If it is a product or room photo, keep that product or room as the core subject.
- Preserve the reference image's main subject type, camera angle or flat-layout structure, composition, visual hierarchy, color palette, typography mood, lighting, texture/material style, and overall design language.
- Do not imitate any previously generated pin for this article.
- Do not default to a generic pantry photo, pantry shelves, jars, labels, or bins unless those elements are visible in the uploaded reference or explicitly requested by the user.
- Use the article topic only to make the pin SEO-relevant and to choose short overlay text. The article topic must not replace the uploaded reference's visual layout or subject type.
- If the user provided a prompt, follow it after preserving the reference image.

Pin copy:
- Primary overlay text: "${copy.overlayText}"
- Pin title context: ${copy.title}
${userPrompt ? `- User direction: ${userPrompt}` : ""}

Design requirements: vertical 2:3 Pinterest marketing design, clean readable text area, no fake logos, no watermark, no distorted text, no clutter.`;
  }

  return `Create a vertical 2:3 Pinterest pin graphic for a home organization blog.
Visual direction: ${copy.imagePrompt}
Primary overlay text: "${copy.overlayText}"
Pin title context: ${copy.title}
${userPrompt ? `Additional user direction: ${userPrompt}` : ""}
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
  url = originalBlobUrl(url);
  if (url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", url);
    const buffer = await fs.readFile(filePath);
    return toFile(buffer, path.basename(url), { type: contentTypeFromName(url) });
  }

  const response = await fetch(url);
  if (!response.ok) {
    const blobFile = await readVercelBlobImage(url);
    if (blobFile) return blobFile;
    throw new Error("Could not read reference image");
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const name = url.split("/").pop()?.split("?")[0] || "reference-image.png";
  return toFile(buffer, name, { type: response.headers.get("content-type") || contentTypeFromName(name) });
}

async function readVercelBlobImage(url: string) {
  const blob = await getBlobWithFallback(url);
  if (!blob || blob.statusCode !== 200) return null;

  const buffer = Buffer.from(await new Response(blob.stream).arrayBuffer());
  const name = url.split("/").pop()?.split("?")[0] || "reference-image.png";
  return toFile(buffer, name, { type: blob.blob.contentType || contentTypeFromName(name) });
}

async function getBlobWithFallback(url: string) {
  const access = process.env.BLOB_ACCESS === "private" ? "private" : "public";
  try {
    const blob = await get(url, { access });
    if (blob?.statusCode === 200 || access === "private") return blob;
  } catch (error) {
    if (!isPrivateStoreAccessError(error)) return null;
  }

  try {
    return await get(url, { access: "private" });
  } catch {
    return null;
  }
}

function isPrivateStoreAccessError(error: unknown) {
  return error instanceof Error && error.message.includes("Cannot use public access on a private store");
}

function contentTypeFromName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "image/png";
}
