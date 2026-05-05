import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex items-start justify-between gap-4 border-b border-[#dde7df] pb-6", className)}>
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6f8576]">Admin</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#121a16]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6c776f]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
