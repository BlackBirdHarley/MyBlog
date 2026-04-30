"use client";

import { useRef, useState, useEffect } from "react";
import { AlignLeft, AlignCenter, AlignRight, ImageIcon, Upload, Link2, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/react";
import type { ImageAlign } from "./extensions/ImageAlign";

const ALIGN_OPTIONS: { value: ImageAlign; icon: React.ReactNode; label: string }[] = [
  { value: "left",   icon: <AlignLeft size={13} />,   label: "Float left"  },
  { value: "center", icon: <AlignCenter size={13} />, label: "Full width"  },
  { value: "right",  icon: <AlignRight size={13} />,  label: "Float right" },
];

export function ImageInsertPanel({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [align, setAlign] = useState<ImageAlign>("center");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function insert(src: string) {
    editor.chain().focus().insertContent({ type: "image", attrs: { src, align } }).run();
    setOpen(false);
    setUrl("");
    setError(null);
  }

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      const media = await res.json();
      insert(media.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        title="Insert image"
        className={cn(
          "flex items-center gap-0.5 p-1.5 rounded-md transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <ImageIcon size={15} />
        <ChevronDown size={11} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-64 p-3 space-y-3">
          {/* Tab switch */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setTab("upload"); }}
              className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                tab === "upload" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              <Upload size={12} /> Upload
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setTab("url"); }}
              className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                tab === "url" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              <Link2 size={12} /> URL
            </button>
          </div>

          {/* Alignment selector */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Alignment</p>
            <div className="flex gap-1">
              {ALIGN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setAlign(opt.value); }}
                  title={opt.label}
                  className={cn(
                    "flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs transition-colors border",
                    align === opt.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-200 text-gray-500 hover:border-gray-400"
                  )}
                >
                  {opt.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Upload or URL */}
          {tab === "upload" ? (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Uploading…" : "Choose file"}
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                onKeyDown={(e) => { if (e.key === "Enter" && url) { e.preventDefault(); insert(url); } }}
              />
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); if (url) insert(url); }}
                disabled={!url}
                className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                Insert
              </button>
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
        </div>
      )}
    </div>
  );
}
