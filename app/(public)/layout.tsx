import { prisma } from "@/lib/prisma";
import { PublicNav } from "@/components/public/PublicNav";
import Link from "next/link";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } }).catch(() => null);
  const siteName = settings?.siteName ?? "My Blog";
  const footerText = settings?.footerText ?? `(c) ${new Date().getFullYear()} ${siteName}`;

  return (
    <div className="min-h-screen bg-[#fbfcf9]">
      <PublicNav siteName={siteName} logoUrl={settings?.siteLogoUrl ?? null} />
      {children}
      <footer className="border-t border-[#dfe8e0] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-9 sm:flex-row sm:px-8 lg:px-10">
          <span className="text-[11px] uppercase tracking-[0.08em] text-[#8d9a91]">{footerText}</span>
          <div className="flex items-center gap-6">
            <Link href="/about" className="text-[11px] uppercase tracking-[0.08em] text-[#8d9a91] transition-colors hover:text-[#17201b]">About</Link>
            <Link href="/privacy" className="text-[11px] uppercase tracking-[0.08em] text-[#8d9a91] transition-colors hover:text-[#17201b]">Privacy</Link>
            <Link href="/disclosure" className="text-[11px] uppercase tracking-[0.08em] text-[#8d9a91] transition-colors hover:text-[#17201b]">Disclosure</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
