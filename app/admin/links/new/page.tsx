import { PageHeader } from "@/components/admin/PageHeader";
import { LinkForm } from "@/components/admin/LinkForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewLinkPage() {
  return (
    <div className="p-8">
      <Link href="/admin/links" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Affiliate Links
      </Link>
      <PageHeader title="New affiliate link" className="mb-6" />
      <LinkForm />
    </div>
  );
}
