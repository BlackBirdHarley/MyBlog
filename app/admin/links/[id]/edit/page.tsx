import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/PageHeader";
import { LinkForm } from "@/components/admin/LinkForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const link = await prisma.affiliateLink.findUnique({ where: { id } });
  if (!link) notFound();

  return (
    <div className="p-8">
      <Link href={`/admin/links/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Link details
      </Link>
      <PageHeader title={link.name} className="mb-6" />
      <LinkForm
        linkId={id}
        initialData={{
          name: link.name,
          displayLabel: link.displayLabel ?? undefined,
          targetUrl: link.targetUrl,
          program: link.program ?? undefined,
          category: link.category ?? undefined,
          commission: link.commission ? Number(link.commission) : undefined,
          notes: link.notes ?? undefined,
          isActive: link.isActive,
        }}
      />
    </div>
  );
}
