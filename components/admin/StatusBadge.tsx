import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PUBLISHED: "bg-green-100 text-green-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  ARCHIVED: "bg-orange-100 text-orange-700",
};

const labels: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  SCHEDULED: "Scheduled",
  ARCHIVED: "Archived",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", styles[status] ?? "bg-gray-100 text-gray-600")}>
      {labels[status] ?? status}
    </span>
  );
}
