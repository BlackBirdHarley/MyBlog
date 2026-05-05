import Link from "next/link";
import Image from "next/image";

export function PublicNav({ siteName, logoUrl }: { siteName: string; logoUrl?: string | null }) {
  const initials = siteName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-[#dfe8e0] bg-[#fbfcf9]/92 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
        {/* Logo + brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#17201b] shadow-sm">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${siteName} logo`}
                fill
                priority
                className="object-cover"
                sizes="36px"
              />
            ) : (
              <span className="text-white text-[11px] font-bold tracking-wider">{initials}</span>
            )}
          </div>
          <span className="hidden text-[15px] font-semibold tracking-tight text-[#17201b] sm:block">
            {siteName}
          </span>
        </Link>

        {/* Desktop navigation - all original menu items preserved */}
        <nav className="hidden items-center gap-7 rounded-full border border-[#e2e9e1] bg-white/70 px-5 py-2 shadow-sm md:flex">
          <Link href="/blog" className="text-[11px] uppercase tracking-[0.08em] text-[#66736b] hover:text-[#17201b] transition-colors font-semibold">
            Blog
          </Link>
          <Link href="/about" className="text-[11px] uppercase tracking-[0.08em] text-[#66736b] hover:text-[#17201b] transition-colors font-semibold">
            About
          </Link>
          <Link href="/disclosure" className="text-[11px] uppercase tracking-[0.08em] text-[#66736b] hover:text-[#17201b] transition-colors font-semibold">
            Disclosure
          </Link>
          <Link href="/privacy" className="text-[11px] uppercase tracking-[0.08em] text-[#66736b] hover:text-[#17201b] transition-colors font-semibold">
            Privacy
          </Link>
        </nav>

        {/* Mobile navigation - most important items only */}
        <nav className="flex md:hidden items-center gap-5">
          <Link href="/blog" className="text-[11px] uppercase tracking-[0.08em] text-[#66736b] hover:text-[#17201b] transition-colors font-semibold">
            Blog
          </Link>
          <Link href="/about" className="text-[11px] uppercase tracking-[0.08em] text-[#66736b] hover:text-[#17201b] transition-colors font-semibold">
            About
          </Link>
        </nav>

        {/* CTA */}
        <Link
          href="/blog"
          className="flex items-center rounded-lg bg-[#17201b] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-white shadow-sm transition-all hover:-translate-y-px hover:bg-[#2f4d3f] hover:shadow-md"
        >
          Explore
        </Link>
      </div>
    </header>
  );
}
