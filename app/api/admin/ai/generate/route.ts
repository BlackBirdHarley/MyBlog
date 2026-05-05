import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { extractText } from "@/lib/content-renderer";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (body.task === "seo-fix") {
    return generateSeoFix(body);
  }

  const { title, keywords, instructions, length = "medium" } = body;
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const wordTarget =
    length === "short"  ? "600-900"  :
    length === "long"   ? "2000-2800" : "1200-1700";

  const prompt = `Write a comprehensive blog article in HTML format.

Title: ${title}
${keywords ? `Focus keywords: ${keywords}` : ""}
${instructions ? `Additional instructions: ${instructions}` : ""}
Target length: ${wordTarget} words

Requirements:
- Return ONLY the article body HTML, no <html>/<body>/<head> tags
- Use <h2> for main sections, <h3> for subsections
- Use <p> for paragraphs, <ul>/<ol>/<li> for lists, <strong>/<em> for emphasis
- No inline styles, no class attributes
- Write engaging, informative content with practical value
- Include a strong introduction and a conclusion
- Do not include the title as an H1 (it is handled separately)`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const html = response.choices[0]?.message?.content ?? "";
    return NextResponse.json({ html });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 }
    );
  }
}

async function generateSeoFix(body: {
  field?: string;
  title?: string;
  excerpt?: string;
  content?: object;
  currentMetaTitle?: string;
  currentMetaDescription?: string;
  heroAlt?: string | null;
  pins?: Array<{
    imageUrl?: string;
    title?: string;
    altText?: string;
    description?: string;
    linkUrl?: string;
    taggedTopics?: string[];
  }>;
  categories?: Array<{ id: string; name: string }>;
  tags?: Array<{ id: string; name: string }>;
}) {
  const field = body.field;
  if (!field) return NextResponse.json({ error: "SEO field required" }, { status: 400 });

  const articleText = body.content ? extractText(body.content).slice(0, 7000) : "";
  const categories = (body.categories ?? []).map((c) => `${c.id}: ${c.name}`).join("\n") || "None";
  const tags = (body.tags ?? []).map((t) => `${t.id}: ${t.name}`).join("\n") || "None";
  const pins = (body.pins ?? []).map((p, index) => ({
    index,
    hasImage: Boolean(p.imageUrl),
    title: p.title ?? "",
    altText: p.altText ?? "",
    description: p.description ?? "",
    linkUrl: p.linkUrl ?? "",
    taggedTopics: p.taggedTopics ?? [],
  }));

  const prompt = `You are an SEO editor for a home organization blog.

Return ONLY valid JSON. No markdown, no commentary.

Task field: ${field}
Article title: ${body.title || ""}
Article excerpt: ${body.excerpt || ""}
Current meta title: ${body.currentMetaTitle || ""}
Current meta description: ${body.currentMetaDescription || ""}
Current hero ALT: ${body.heroAlt || ""}

Article text:
${articleText}

Available categories:
${categories}

Available tags:
${tags}

Pins:
${JSON.stringify(pins)}

Rules:
- Optimize for helpful search intent, clarity, and natural keywords.
- Do not keyword-stuff.
- Keep metaTitle 45-60 characters.
- Keep metaDescription 120-160 characters.
- ALT text must describe the image naturally and be useful for accessibility.
- Category/tag suggestions must use only the provided ids.
- Pinterest pin descriptions must not include URLs, "Visit:", "Read more", or article link text. Use linkUrl only for the link.

JSON shape by field:
- title: {"title":"..."}
- metaTitle: {"metaTitle":"..."}
- metaDescription: {"metaDescription":"..."}
- heroAlt: {"heroAlt":"..."}
- categoryTags: {"categoryId":"existing category id or empty string","tagIds":["existing tag id"]}
- pinterestPins: {"pins":[{"index":0,"title":"...","altText":"...","description":"...","linkUrl":"...","taggedTopics":["..."]}]}`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return NextResponse.json(normalizeSeoFix(field, parsed, body));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "SEO generation failed" },
      { status: 500 }
    );
  }
}

function normalizeSeoFix(
  field: string,
  data: Record<string, unknown>,
  body: {
    title?: string;
    excerpt?: string;
    pins?: Array<{ imageUrl?: string; altText?: string; description?: string }>;
    categories?: Array<{ id: string; name: string }>;
    tags?: Array<{ id: string; name: string }>;
  }
) {
  const stringValue = (...keys: string[]) => {
    for (const key of keys) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  };

  if (field === "title") {
    return { title: stringValue("title", "headline", "metaTitle", "meta_title") || body.title || "" };
  }

  if (field === "metaTitle") {
    return { metaTitle: stringValue("metaTitle", "meta_title", "seoTitle", "seo_title", "title") || body.title || "" };
  }

  if (field === "metaDescription") {
    return {
      metaDescription:
        stringValue("metaDescription", "meta_description", "seoDescription", "seo_description", "description") ||
        body.excerpt ||
        "",
    };
  }

  if (field === "heroAlt") {
    return { heroAlt: stringValue("heroAlt", "hero_alt", "altText", "alt_text", "alt") };
  }

  if (field === "categoryTags") {
    const categoryId = stringValue("categoryId", "category_id");
    const tagIds = Array.isArray(data.tagIds)
      ? data.tagIds
      : Array.isArray(data.tag_ids)
        ? data.tag_ids
        : [];
    const validCategoryId = body.categories?.some((category) => category.id === categoryId) ? categoryId : "";
    const validTagIds = tagIds.filter((id): id is string =>
      typeof id === "string" && Boolean(body.tags?.some((tag) => tag.id === id))
    );
    return { categoryId: validCategoryId, tagIds: validTagIds };
  }

  if (field === "pinterestPins") {
    const rawPins = Array.isArray(data.pins)
      ? data.pins
      : Array.isArray(data.pinterestPins)
        ? data.pinterestPins
        : data.pin && typeof data.pin === "object"
          ? [data.pin]
          : [];

    const pins = rawPins.map((pin, index) => {
      const item = pin && typeof pin === "object" ? pin as Record<string, unknown> : {};
      const sourceIndex = typeof item.index === "number" ? item.index : index;
      return {
        index: sourceIndex,
        title: typeof item.title === "string" ? item.title : "",
        altText: typeof item.altText === "string" ? item.altText : typeof item.alt_text === "string" ? item.alt_text : "",
        description: stripUrls(typeof item.description === "string" ? item.description : typeof item.pinDescription === "string" ? item.pinDescription : ""),
        linkUrl: typeof item.linkUrl === "string" ? item.linkUrl : typeof item.link === "string" ? item.link : "",
        taggedTopics: Array.isArray(item.taggedTopics)
          ? item.taggedTopics.filter((topic): topic is string => typeof topic === "string")
          : Array.isArray(item.tags)
            ? item.tags.filter((topic): topic is string => typeof topic === "string")
            : [],
      };
    });

    if (pins.length > 0) return { pins };

    return {
      pins: (body.pins ?? []).map((_, index) => ({
        index,
        title: stringValue("title", "pinTitle", "pin_title"),
        altText: stringValue("altText", "alt_text", "alt"),
        description: stripUrls(stringValue("description", "pinDescription", "pin_description")),
        linkUrl: stringValue("linkUrl", "link", "url"),
        taggedTopics: [],
      })),
    };
  }

  return data;
}

function stripUrls(value: string) {
  return value
    .replace(/\b(?:Visit|Read more|Learn more|See more)\s*:?\s*https?:\/\/\S+/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(?:Visit|Read more|Learn more|See more)(?:\s+at)?\s*:?\s*$/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
