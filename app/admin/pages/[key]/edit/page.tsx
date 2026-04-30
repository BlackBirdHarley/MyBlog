import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StaticPageForm } from "@/components/admin/StaticPageForm";
import { STATIC_PAGE_DEFAULTS } from "@/lib/static-page-defaults";

const ALLOWED_KEYS = ["about", "privacy", "disclosure"];

const PAGE_LABELS: Record<string, string> = {
  about: "About",
  privacy: "Privacy Policy",
  disclosure: "Affiliate Disclosure",
};

interface Props {
  params: Promise<{ key: string }>;
}

export default async function StaticPageEditPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const { key } = await params;
  if (!ALLOWED_KEYS.includes(key)) notFound();

  const saved = await prisma.staticPage.findUnique({ where: { id: key } });
  const defaults = STATIC_PAGE_DEFAULTS[key];

  const initialTitle = saved?.title ?? defaults.title;
  const initialContent = (saved?.content as object) ?? defaults.content;

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/admin/pages"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={14} /> Pages
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">{PAGE_LABELS[key]}</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Accessible at{" "}
          <a
            href={`/${key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-rose-600 hover:underline"
          >
            /{key}
          </a>
        </p>
      </div>

      <StaticPageForm
        pageKey={key}
        initialTitle={initialTitle}
        initialContent={initialContent}
      />
    </div>
  );
}
