import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";

const PAGES = [
  { key: "about",       label: "About",               description: "About the blog and author" },
  { key: "privacy",     label: "Privacy Policy",       description: "Data collection and cookie policy" },
  { key: "disclosure",  label: "Affiliate Disclosure", description: "FTC affiliate disclosure statement" },
];

export default async function PagesListPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const saved = await prisma.staticPage.findMany({
    where: { id: { in: PAGES.map((p) => p.key) } },
  });
  const savedMap = Object.fromEntries(saved.map((p) => [p.id, p]));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Pages</h1>
        <p className="text-gray-500 mt-1">Edit static pages shown on the public site.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-2xl">
        {PAGES.map((page, i) => {
          const saved = savedMap[page.key];
          return (
            <div
              key={page.key}
              className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-gray-100" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{page.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {saved
                    ? `Last updated ${formatDate(saved.updatedAt)}`
                    : page.description}
                </p>
              </div>
              <Link
                href={`/admin/pages/${page.key}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shrink-0"
              >
                <Pencil size={13} />
                Edit
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
