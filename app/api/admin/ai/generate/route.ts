import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, keywords, instructions, length = "medium" } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const wordTarget =
    length === "short"  ? "600–900"  :
    length === "long"   ? "2000–2800" : "1200–1700";

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
