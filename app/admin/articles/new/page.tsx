import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/editor/ArticleForm";
import { PageHeader } from "@/components/admin/PageHeader";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewArticlePage() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/articles" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4">
          <ArrowLeft size={14} /> Articles
        </Link>
        <PageHeader title="New article" />
      </div>
      <ArticleForm categories={categories} tags={tags} />
    </div>
  );
}
