"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Link2,
  ImageIcon,
  BarChart2,
  FolderOpen,
  Settings,
  FileEdit,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/articles", label: "Articles", icon: FileText },
  { href: "/admin/links", label: "Affiliate Links", icon: Link2 },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/categories", label: "Taxonomy", icon: FolderOpen },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/pages", label: "Pages", icon: FileEdit },
  { href: "/admin/help", label: "Help", icon: HelpCircle },
];

export function Sidebar({
  showSignOut = true,
  siteName = "PinBlog",
  logoUrl,
}: {
  showSignOut?: boolean;
  siteName?: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const initials = siteName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-[#1f2a23] bg-[#121a16]">
      <div className="border-b border-white/8 px-5 py-6">
        <Link href="/" className="flex items-center gap-3" title="Open site">
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white text-sm font-bold text-[#121a16]">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${siteName} logo`}
                fill
                priority
                className="object-cover"
                sizes="40px"
              />
            ) : (
              initials
            )}
          </span>
          <span>
            <span className="block text-base font-semibold tracking-tight text-white">{siteName}</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8fa194]">
              Admin workspace
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(href, exact)
                ? "bg-white text-[#121a16] shadow-sm"
                : "text-[#aab8ad] hover:bg-white/8 hover:text-white"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      {showSignOut && (
        <div className="border-t border-white/8 px-3 py-4">
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#aab8ad] transition-colors hover:bg-white/8 hover:text-white"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
