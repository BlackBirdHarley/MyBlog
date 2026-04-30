import { prisma } from "@/lib/prisma";
import { PublicNav } from "@/components/public/PublicNav";
import Link from "next/link";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } }).catch(() => null);
  const siteName = settings?.siteName ?? "My Blog";
  const footerText = settings?.footerText ?? `© ${new Date().getFullYear()} ${siteName}`;

  return (
    <div className="min-h-screen bg-white">
      <PublicNav siteName={siteName} />
      {children}
      <footer className="border-t border-[#E7ECEF]">
        <div className="px-8 lg:px-14 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[11px] uppercase tracking-[0.08em] text-[#9AA3AA]">{footerText}</span>
          <div className="flex items-center gap-6">
            <Link href="/about" className="text-[11px] uppercase tracking-[0.08em] text-[#9AA3AA] hover:text-[#1E252B] transition-colors">About</Link>
            <Link href="/privacy" className="text-[11px] uppercase tracking-[0.08em] text-[#9AA3AA] hover:text-[#1E252B] transition-colors">Privacy</Link>
            <Link href="/disclosure" className="text-[11px] uppercase tracking-[0.08em] text-[#9AA3AA] hover:text-[#1E252B] transition-colors">Disclosure</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
