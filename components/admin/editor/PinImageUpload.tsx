"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface PinImageUploadProps {
  value: string | null;
  altText: string;
  onChange: (url: string | null, altText?: string) => void;
}

export function PinImageUpload({ value, altText, onChange }: PinImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", altText);
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      const media = await res.json();

      onChange(media.url, media.altText ?? altText);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="w-20 shrink-0">
      {value ? (
        <div className="relative group h-[120px] w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
          <img
            src={value}
            alt={altText}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 bg-white/90 hover:bg-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={11} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-1 cursor-pointer rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors aspect-2/3"
        >
          {uploading ? (
            <Loader2 size={14} className="text-gray-400 animate-spin" />
          ) : (
            <>
              <Upload size={14} className="text-gray-300" />
              <span className="text-xs text-gray-400">2:3</span>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
      {error && <p className="text-xs text-red-600 mt-1 leading-tight">{error}</p>}
    </div>
  );
}
