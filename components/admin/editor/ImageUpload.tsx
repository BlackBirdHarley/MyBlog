"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: { id: string; url: string; altText?: string | null } | null;
  onChange: (media: { id: string; url: string; altText?: string | null } | null) => void;
  label?: string;
  aspectRatio?: string;
}

export function ImageUpload({ value, onChange, label = "Image", aspectRatio = "aspect-video" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      let media: { id: string; url: string; altText?: string | null };

      try {
        // Client-side upload directly to Vercel Blob (no serverless body limit)
        const { upload } = await import("@vercel/blob/client");
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/admin/media/upload",
        });
        const res = await fetch("/api/admin/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: blob.url, filename: file.name, fileSize: file.size, mimeType: file.type }),
        });
        if (!res.ok) throw new Error("Failed to register media");
        media = await res.json();
      } catch {
        // Fallback: server-side upload (local dev without Vercel Blob)
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Upload failed");
        }
        media = await res.json();
      }

      onChange(media);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {value ? (
        <div className="relative group rounded-lg overflow-hidden border border-gray-200">
          <div className={cn("relative w-full bg-gray-100", aspectRatio)}>
            <Image src={value.url} alt={value.altText ?? ""} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            "relative w-full border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors",
            aspectRatio
          )}
        >
          {uploading ? (
            <Loader2 size={24} className="text-gray-400 animate-spin" />
          ) : (
            <>
              <Upload size={24} className="text-gray-300" />
              <span className="text-sm text-gray-400">Click or drag to upload</span>
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
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
