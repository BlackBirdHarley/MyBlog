import Link from "next/link";

export function PublicNav({ siteName }: { siteName: string }) {
  const initials = siteName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="bg-white border-b border-[#E7ECEF]">
      <div className="px-8 lg:px-14 h-22 flex items-center justify-between gap-6">
        {/* Logo + brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#26313A] flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-bold tracking-wider">{initials}</span>
          </div>
          <span className="text-[#1E252B] font-semibold text-[15px] tracking-[-0.01em] hidden sm:block">
            {siteName}
          </span>
        </Link>

        {/* Desktop navigation — all original menu items preserved */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          <Link href="/blog" className="text-[11px] uppercase tracking-[0.08em] text-[#7D8790] hover:text-[#1E252B] transition-colors font-medium">
            Blog
          </Link>
          <Link href="/about" className="text-[11px] uppercase tracking-[0.08em] text-[#7D8790] hover:text-[#1E252B] transition-colors font-medium">
            About
          </Link>
          <Link href="/disclosure" className="text-[11px] uppercase tracking-[0.08em] text-[#7D8790] hover:text-[#1E252B] transition-colors font-medium">
            Disclosure
          </Link>
          <Link href="/privacy" className="text-[11px] uppercase tracking-[0.08em] text-[#7D8790] hover:text-[#1E252B] transition-colors font-medium">
            Privacy
          </Link>
        </nav>

        {/* Mobile navigation — most important items only */}
        <nav className="flex md:hidden items-center gap-5">
          <Link href="/blog" className="text-[11px] uppercase tracking-[0.08em] text-[#7D8790] hover:text-[#1E252B] transition-colors font-medium">
            Blog
          </Link>
          <Link href="/about" className="text-[11px] uppercase tracking-[0.08em] text-[#7D8790] hover:text-[#1E252B] transition-colors font-medium">
            About
          </Link>
        </nav>

        {/* CTA */}
        <Link
          href="/blog"
          className="flex items-center px-5 py-2.5 rounded-full bg-[#FF9B7A] text-white text-[11px] font-semibold uppercase tracking-[0.06em] hover:bg-[#F08060] transition-all hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(255,155,122,0.4)]"
        >
          Explore
        </Link>
      </div>
    </header>
  );
}
