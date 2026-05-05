"use client";

import { useState } from "react";
import { Trash2, Copy, Check, ImageIcon, FileImage, Layers3 } from "lucide-react";

interface Media {
  id: string | null;
  key?: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string | null;
  source?: string;
  description?: string | null;
}

interface MediaSection {
  title: string;
  items: Media[];
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary({
  initialMedia,
  sections,
}: {
  initialMedia?: Media[];
  sections?: MediaSection[];
}) {
  const [media, setMedia] = useState(initialMedia ?? []);
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

  if (sections) {
    const total = sections.reduce((sum, section) => sum + section.items.length, 0);
    if (total === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white py-24 text-center">
          <ImageIcon size={22} className="text-gray-300" />
          <p className="text-sm text-gray-400">No images linked to this article yet.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 px-4 pt-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  {section.title === "Inline images" ? <Layers3 size={16} /> : <FileImage size={16} />}
                </span>
                <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
              </div>
              <span className="mr-4 mt-4 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                {section.items.length}
              </span>
            </div>
            {section.items.length > 0 ? (
              <div className="px-4 pb-4">
                <MediaGrid items={section.items} copied={copied} copyUrl={copyUrl} remove={remove} />
              </div>
            ) : (
              <div className="mx-4 mb-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 py-10 text-center text-sm text-gray-400">
                No {section.title.toLowerCase()}.
              </div>
            )}
          </section>
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-24 border border-dashed border-gray-200 rounded-xl">
        <p className="text-gray-400 text-sm">No media uploaded yet.</p>
      </div>
    );
  }

  return (
    <MediaGrid items={media} copied={copied} copyUrl={copyUrl} remove={remove} />
  );
}

function MediaGrid({
  items,
  copied,
  copyUrl,
  remove,
}: {
  items: Media[];
  copied: string | null;
  copyUrl: (url: string) => void;
  remove: (id: string, filename: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.key ?? item.id ?? item.url}
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
        >
          <div className="relative h-48 bg-gray-100 sm:h-52 xl:h-56">
            <img
              src={item.thumbnailUrl ?? item.url}
              alt={item.altText ?? item.filename}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/35 group-hover:opacity-100">
              <button
                onClick={() => copyUrl(item.url)}
                className="rounded-lg bg-white p-2 text-gray-700 shadow transition-colors hover:text-gray-900"
                title="Copy URL"
              >
                {copied === item.url ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
              </button>
              {item.id && (
                <button
                  onClick={() => remove(item.id!, item.filename)}
                  className="rounded-lg bg-white p-2 text-gray-700 shadow transition-colors hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            {item.source && (
              <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-gray-700 shadow-sm ring-1 ring-black/5">
                {item.source}
              </span>
            )}
          </div>
          <div className="space-y-2 px-3 py-3">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-semibold text-gray-800">{item.filename}</p>
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                {formatBytes(item.fileSize)}
              </span>
            </div>
            {item.altText ? (
              <p className="line-clamp-2 rounded-lg bg-gray-50 px-2.5 py-2 text-[11px] leading-relaxed text-gray-600">
                <span className="font-semibold text-gray-700">ALT</span> {item.altText}
              </p>
            ) : (
              <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] font-medium text-amber-700">
                ALT missing
              </p>
            )}
            {item.description && <p className="line-clamp-2 text-[11px] leading-relaxed text-gray-400">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
