import { prisma } from "@/lib/prisma";
import { renderContent } from "@/lib/content-renderer";
import { STATIC_PAGE_DEFAULTS } from "@/lib/static-page-defaults";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await prisma.staticPage.findUnique({ where: { id: "disclosure" } }).catch(() => null);
  return { title: page?.title ?? "Affiliate Disclosure" };
}

export default async function DisclosurePage() {
  const page = await prisma.staticPage.findUnique({ where: { id: "disclosure" } }).catch(() => null);
  const content = (page?.content as object) ?? STATIC_PAGE_DEFAULTS.disclosure.content;
  const title = page?.title ?? STATIC_PAGE_DEFAULTS.disclosure.title;
  const html = renderContent(content);

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">{title}</h1>
      <div className="prose prose-gray" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
