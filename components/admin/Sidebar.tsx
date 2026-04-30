"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Link2,
  ImageIcon,
  BarChart2,
  Tag,
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
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/tags", label: "Tags", icon: Tag },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/pages", label: "Pages", icon: FileEdit },
  { href: "/admin/help", label: "Help", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-60 min-h-screen bg-gray-950 flex flex-col">
      <div className="px-5 py-6 border-b border-gray-800">
        <Link href="/admin" className="text-white font-semibold text-lg tracking-tight">
          PinBlog
        </Link>
        <span className="ml-2 text-xs text-gray-500 font-medium uppercase tracking-widest">
          Admin
        </span>
      </div>

      <nav className="flex-1 py-4 space-y-0.5 px-3">
        {nav.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive(href, exact)
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800/60"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
