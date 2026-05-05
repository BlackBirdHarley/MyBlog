import { Sidebar } from "@/components/admin/Sidebar";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } }).catch(() => null);
  const siteName = settings?.siteName ?? "PinBlog";

  return (
    <div className="flex min-h-screen bg-[#f6f8f6] text-[#121a16]">
      <Sidebar
        showSignOut={process.env.DISABLE_ADMIN_AUTH !== "true"}
        siteName={siteName}
        logoUrl={settings?.siteLogoUrl ?? null}
      />
      <main className="min-w-0 flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
