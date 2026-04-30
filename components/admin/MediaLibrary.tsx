"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2, Copy, Check } from "lucide-react";

interface Media {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary({ initialMedia }: { initialMedia: Media[] }) {
  const [media, setMedia] = useState(initialMedia);
  const [copied, setCopied] = useState<string | null>(null);

  async function remove(id: string, filename: string) {
    if (!confirm(`Delete "${filename}"?`)) return;
    const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    if (res.ok) setMedia((prev) => prev.filter((m) => m.id !== id));
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-24 border border-dashed border-gray-200 rounded-xl">
        <p className="text-gray-400 text-sm">No media uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {media.map((item) => (
        <div key={item.id} className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="relative aspect-square bg-gray-50">
            <Image
              src={item.thumbnailUrl ?? item.url}
              alt={item.altText ?? item.filename}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => copyUrl(item.url)}
                className="p-2 bg-white rounded-lg shadow text-gray-700 hover:text-gray-900 transition-colors"
                title="Copy URL"
              >
                {copied === item.url ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
              </button>
              <button
                onClick={() => remove(item.id, item.filename)}
                className="p-2 bg-white rounded-lg shadow text-gray-700 hover:text-red-600 transition-colors"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          <div className="px-2.5 py-2">
            <p className="text-xs text-gray-700 truncate font-medium">{item.filename}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{formatBytes(item.fileSize)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
