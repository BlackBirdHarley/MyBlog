"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, Check } from "lucide-react";
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
  const [altDraft, setAltDraft] = useState<{ mediaId: string; sourceAlt: string; value: string } | null>(null);
  const [savingAlt, setSavingAlt] = useState(false);
  const [altSaved, setAltSaved] = useState(false);
  const sourceAlt = value?.altText ?? "";
  const altText = value && altDraft?.mediaId === value.id && altDraft.sourceAlt === sourceAlt
    ? altDraft.value
    : sourceAlt;

  async function saveAlt(mediaId: string, nextAltText: string) {
    setSavingAlt(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/media/${mediaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ altText: nextAltText }),
      });
      if (!res.ok) throw new Error("Failed to save ALT");
      onChange(await res.json());
      setAltSaved(true);
      setTimeout(() => setAltSaved(false), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save ALT");
    } finally {
      setSavingAlt(false);
    }
  }

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
      const media: { id: string; url: string; altText?: string | null } = await res.json();

      onChange(media);
      setAltDraft(null);
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
        <div className="space-y-2">
          <div
            className="article-image-alt-hover relative group rounded-lg overflow-hidden border border-gray-200"
            data-alt={altText.trim() || undefined}
          >
            <div className={cn("relative w-full bg-gray-100", aspectRatio)}>
              <Image src={value.url} alt={value.altText ?? ""} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
            </div>
            <button
              type="button"
              onClick={() => { onChange(null); setAltDraft(null); }}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={altText}
              onChange={(e) => setAltDraft({ mediaId: value.id, sourceAlt, value: e.target.value })}
              className="min-w-0 flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              placeholder="ALT text for this image"
            />
            <button
              type="button"
              onClick={() => saveAlt(value.id, altText)}
              disabled={savingAlt}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {savingAlt ? <Loader2 size={13} className="animate-spin" /> : altSaved ? <Check size={13} /> : null}
              {altSaved ? "Saved" : "Save"}
            </button>
          </div>
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
