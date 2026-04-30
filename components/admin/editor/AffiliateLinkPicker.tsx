"use client";

import { useState, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { Link2, Search, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AffiliateLink {
  id: string;
  name: string;
  displayLabel: string | null;
  program: string | null;
  isActive: boolean;
}

interface AffiliateLinkPickerProps {
  editor: Editor;
}

export function AffiliateLinkPicker({ editor }: AffiliateLinkPickerProps) {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isActive = editor.isActive("affiliateLink");

  // Load links when picker opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/admin/links?isActive=true")
      .then((r) => r.json())
      .then((data) => setLinks(data))
      .catch(() => {})
      .finally(() => setLoading(false));
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function insertLink(link: AffiliateLink) {
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to
    );
    const label = selectedText || link.displayLabel || link.name;

    // If no text selected, insert the label text then apply mark
    if (!selectedText) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: label,
          marks: [{ type: "affiliateLink", attrs: { linkId: link.id, displayLabel: link.displayLabel } }],
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .setAffiliateLink({ linkId: link.id, displayLabel: link.displayLabel ?? undefined })
        .run();
    }

    setOpen(false);
    setSearch("");
  }

  function removeLink() {
    editor.chain().focus().unsetAffiliateLink().run();
  }

  const filtered = links.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.program ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setOpen(!open); }}
          title="Insert affiliate link"
          className={cn(
            "p-1.5 rounded-md transition-colors text-gray-500",
            (isActive || open) ? "bg-rose-100 text-rose-600" : "hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <Link2 size={15} />
        </button>
        {isActive && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); removeLink(); }}
            title="Remove affiliate link"
            className="p-1.5 rounded-md text-rose-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
              <Search size={13} className="text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search affiliate links…"
                className="flex-1 text-sm bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <p className="text-xs text-gray-400 text-center py-6">Loading…</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-gray-400">No links found</p>
                <a
                  href="/admin/links/new"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-rose-600 mt-1 hover:underline"
                >
                  <ExternalLink size={11} /> Add new link
                </a>
              </div>
            ) : (
              filtered.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); insertLink(link); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-900">{link.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {link.displayLabel && (
                      <span className="text-xs text-gray-400">"{link.displayLabel}"</span>
                    )}
                    {link.program && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        {link.program}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
            <a
              href="/admin/links/new"
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <ExternalLink size={11} /> Manage links
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
