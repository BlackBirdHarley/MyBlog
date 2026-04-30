"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { AlignLeft, AlignCenter, AlignRight, Upload, X, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ImageAlign } from "./extensions/ImageAlign";

export function ImageAlignNodeView({ node, updateAttributes, selected, deleteNode }: NodeViewProps) {
  const { src, alt, align = "center" } = node.attrs as { src: string; alt: string | null; align: ImageAlign };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrapperCls =
    align === "left"
      ? "float-left mr-6 mb-3 w-2/5 max-w-[280px]"
      : align === "right"
      ? "float-right ml-6 mb-3 w-2/5 max-w-[280px]"
      : "clear-both w-full my-4";

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      const media = await res.json();
      updateAttributes({ src: media.url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <NodeViewWrapper as="div" className={wrapperCls} data-drag-handle>
      <div
        className={cn(
          "relative group rounded-xl overflow-hidden",
          selected && "ring-2 ring-gray-900 ring-offset-2"
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt ?? ""} className="w-full block rounded-xl" />
        ) : (
          <div className="w-full aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}

        {/* Alignment + action controls */}
        <div
          className={cn(
            "absolute top-2 left-2 flex items-center gap-0.5 bg-white/95 shadow-md rounded-lg px-1 py-1 border border-gray-100",
            selected ? "flex" : "hidden group-hover:flex"
          )}
        >
          {(["left", "center", "right"] as ImageAlign[]).map((a) => (
            <button
              key={a}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); updateAttributes({ align: a }); }}
              className={cn(
                "p-1 rounded transition-colors",
                align === a ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:bg-gray-100"
              )}
              title={a === "left" ? "Float left" : a === "right" ? "Float right" : "Full width"}
            >
              {a === "left" && <AlignLeft size={13} />}
              {a === "center" && <AlignCenter size={13} />}
              {a === "right" && <AlignRight size={13} />}
            </button>
          ))}

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
            disabled={uploading}
            className="p-1 rounded text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Replace image"
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          </button>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); deleteNode(); }}
            className="p-1 rounded text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete image"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
      />
    </NodeViewWrapper>
  );
}
