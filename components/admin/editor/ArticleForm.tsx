"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { TipTapEditor } from "./TipTapEditor";
import { ImageUpload } from "./ImageUpload";
import { Save, Send, Loader2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils";
import { PinterestPins, type PinItem } from "./PinterestPins";

interface Category { id: string; name: string; }
interface Tag { id: string; name: string; }
interface MediaItem { id: string; url: string; altText?: string | null; }

interface ArticleFormProps {
  articleId?: string;
  initialData?: {
    title: string;
    slug: string;
    excerpt: string | null;
    content: object;
    status: string;
    featured: boolean;
    categoryId: string | null;
    tagIds: string[];
    heroImage: MediaItem | null;
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    publishedAt: string | null;
    pins: { imageUrl: string; description: string | null }[];
  };
  categories: Category[];
  tags: Tag[];
}


export function ArticleForm({ articleId, initialData, categories, tags }: ArticleFormProps) {
  const router = useRouter();
  const isNew = !articleId;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!!initialData?.slug);
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [content, setContent] = useState<object>(initialData?.content ?? {});
  const [status, setStatus] = useState(initialData?.status ?? "DRAFT");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tagIds ?? []);
  const [heroImage, setHeroImage] = useState<MediaItem | null>(initialData?.heroImage ?? null);
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonicalUrl ?? "");
  const [pins, setPins] = useState<PinItem[]>(
    (initialData?.pins ?? []).map((p) => ({
      key: crypto.randomUUID(),
      imageUrl: p.imageUrl,
      description: p.description ?? "",
    }))
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [seoOpen, setSeoOpen] = useState(false);
  const [pinterestOpen, setPinterestOpen] = useState(false);

  // Auto-slug from title
  useEffect(() => {
    if (!slugEdited && title) setSlug(slugify(title));
  }, [title, slugEdited]);

  const buildPayload = useCallback(() => ({
    title,
    slug,
    excerpt: excerpt || null,
    content,
    status,
    featured,
    categoryId: categoryId || null,
    tagIds: selectedTags,
    heroImageId: heroImage?.id ?? null,
    metaTitle: metaTitle || null,
    metaDescription: metaDescription || null,
    canonicalUrl: canonicalUrl || null,
  }), [title, slug, excerpt, content, status, featured, categoryId, selectedTags, heroImage, metaTitle, metaDescription, canonicalUrl]);

  async function save(overrideStatus?: string) {
    if (!title.trim()) { setSaveError("Title is required"); return; }
    setSaving(true);
    setSaveError(null);
    const payload = { ...buildPayload(), ...(overrideStatus ? { status: overrideStatus } : {}) };

    try {
      const url = isNew ? "/api/admin/articles" : `/api/admin/articles/${articleId}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const savedId = articleId ?? data.id;

      // Save pins
      const validPins = pins.filter((p) => p.imageUrl);
      await fetch(`/api/admin/articles/${savedId}/pins`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPins.map((p, i) => ({
          imageUrl: p.imageUrl,
          description: p.description || null,
          sortOrder: i,
        }))),
      });

      setLastSaved(new Date());
      if (overrideStatus) setStatus(overrideStatus);
      if (isNew) router.replace(`/admin/articles/${data.id}/edit`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // Auto-save every 30s for existing articles
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!isNew) {
      autoSaveRef.current = setInterval(() => save(), 30000);
    }
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, buildPayload]);

  function toggleTag(id: string) {
    setSelectedTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  }

  const isDirty = true; // simplification — always allow save

  return (
    <div className="flex gap-6 items-start">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title…"
          className="w-full text-3xl font-semibold text-gray-900 placeholder-gray-300 border-0 focus:outline-none bg-transparent"
        />

        {/* Slug */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">/blog/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
            className="flex-1 text-gray-500 border-0 border-b border-transparent hover:border-gray-200 focus:border-gray-400 focus:outline-none bg-transparent pb-0.5"
            placeholder="article-slug"
          />
        </div>

        {/* Editor */}
        <TipTapEditor content={content} onChange={setContent} placeholder="Start writing your article…" />

        {/* SEO section */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setSeoOpen(!seoOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            SEO
            {seoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {seoOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Meta title</label>
                <input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || "Defaults to article title"}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <p className="text-xs text-gray-400 mt-1">{metaTitle.length}/60 chars</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Meta description</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  placeholder={excerpt || "Defaults to excerpt"}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{metaDescription.length}/160 chars</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Canonical URL</label>
                <input
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="https://…  (leave blank for default)"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pinterest section */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setPinterestOpen(!pinterestOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <span className="flex items-center gap-2">
              Pinterest pins
              {pins.length > 0 && (
                <span className="text-xs font-normal bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{pins.length}</span>
              )}
            </span>
            {pinterestOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {pinterestOpen && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
              <PinterestPins value={pins} onChange={setPins} />
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-72 shrink-0 space-y-4 sticky top-6">
        {/* Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          {saveError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>
          )}
          {lastSaved && (
            <p className="text-xs text-gray-400">
              Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}

          <button
            type="button"
            onClick={() => save()}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save draft
          </button>

          {status !== "PUBLISHED" ? (
            <button
              type="button"
              onClick={() => save("PUBLISHED")}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <Send size={15} />
              Publish
            </button>
          ) : (
            <div className="flex gap-2">
              <a
                href={`/blog/${slug}`}
                target="_blank"
                className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Eye size={14} />
                View
              </a>
              <button
                type="button"
                onClick={() => save("DRAFT")}
                disabled={saving}
                className="flex-1 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Unpublish
              </button>
            </div>
          )}
        </div>

        {/* Hero image */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <ImageUpload value={heroImage} onChange={setHeroImage} label="Hero image" aspectRatio="aspect-video" />
        </div>

        {/* Excerpt */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Excerpt</h3>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            placeholder="Brief summary shown in article cards…"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          />
        </div>

        {/* Category */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Category</h3>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                    selectedTags.includes(t.id)
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Featured */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 accent-gray-900"
            />
            <div>
              <p className="text-sm font-medium text-gray-700">Featured</p>
              <p className="text-xs text-gray-400">Show on homepage</p>
            </div>
          </label>
        </div>
      </aside>
    </div>
  );
}
