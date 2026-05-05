"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TipTapEditor } from "./TipTapEditor";
import { ImageUpload } from "./ImageUpload";
import { Save, Send, Loader2, Eye, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils";
import { PinterestPins, type PinItem } from "./PinterestPins";

interface Category { id: string; name: string; }
interface Tag { id: string; name: string; categoryId?: string | null; }
interface MediaItem { id: string; url: string; altText?: string | null; }
type SeoChecklistId =
  | "title"
  | "heroImage"
  | "heroAlt"
  | "metaTitle"
  | "metaDescription"
  | "categoryTags"
  | "pinterestPins";
interface SeoChecklistItem {
  id: SeoChecklistId;
  label: string;
  done: boolean;
  hint: string;
  targetId: string;
  canGenerate: boolean;
}

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
    pins: {
      id?: string;
      mediaId?: string | null;
      imageUrl: string;
      title?: string | null;
      altText?: string | null;
      description: string | null;
      linkUrl?: string | null;
      taggedTopics?: string[];
    }[];
  };
  categories: Category[];
  tags: Tag[];
  siteUrl?: string | null;
}


export function ArticleForm({ articleId, initialData, categories, tags, siteUrl }: ArticleFormProps) {
  const router = useRouter();
  const isNew = !articleId;
  const normalizedSiteUrl = siteUrl?.replace(/\/$/, "") ?? "";
  const initialArticleLink = initialData?.slug ? `${normalizedSiteUrl}/blog/${initialData.slug}` : "";

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
      id: p.id,
      mediaId: p.mediaId ?? null,
      key: crypto.randomUUID(),
      imageUrl: p.imageUrl,
      title: p.title ?? initialData?.title ?? "",
      altText: p.altText ?? "",
      description: p.description ?? "",
      linkUrl: p.linkUrl ?? initialArticleLink,
      taggedTopics: p.taggedTopics ?? [],
    }))
  );

  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [seoOpen, setSeoOpen] = useState(false);
  const [pinterestOpen, setPinterestOpen] = useState(true);
  const [generatingSeoItem, setGeneratingSeoItem] = useState<SeoChecklistId | null>(null);
  const [seoFixError, setSeoFixError] = useState<string | null>(null);
  const [seoFixMessage, setSeoFixMessage] = useState<string | null>(null);
  const filteredTags = useMemo(
    () => categoryId ? tags.filter((tag) => tag.categoryId === categoryId) : [],
    [categoryId, tags]
  );
  useEffect(() => {
    const allowedTagIds = new Set(filteredTags.map((tag) => tag.id));
    setSelectedTags((current) => current.filter((tagId) => allowedTagIds.has(tagId)));
  }, [filteredTags]);

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

  const currentSaveKey = useMemo(() => JSON.stringify({
    ...buildPayload(),
    pins: pins.map((p, i) => ({
      id: p.id,
      mediaId: p.mediaId ?? null,
      imageUrl: p.imageUrl,
      title: p.title || null,
      altText: p.altText || null,
      description: p.description || null,
      linkUrl: p.linkUrl || null,
      taggedTopics: p.taggedTopics,
      sortOrder: i,
    })),
  }), [buildPayload, pins]);
  const [lastSavedKey, setLastSavedKey] = useState(currentSaveKey);
  const hasUnsavedChanges = currentSaveKey !== lastSavedKey;

  const seoChecklist = useMemo(
    () => buildSeoChecklist({
      title,
      excerpt,
      heroImage,
      metaTitle,
      metaDescription,
      categoryId,
      selectedTags,
      pins,
      categories,
      tags,
    }),
    [title, excerpt, heroImage, metaTitle, metaDescription, categoryId, selectedTags, pins, categories, tags]
  );
  const completedSeoItems = seoChecklist.filter((item) => item.done).length;

  function serializePins(sourcePins: PinItem[]) {
    const pageOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const toAbsoluteLink = (linkUrl: string) => {
      const trimmed = linkUrl.trim();
      if (!trimmed) return null;
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      const baseUrl = normalizedSiteUrl || pageOrigin;
      return baseUrl ? new URL(trimmed, baseUrl).toString() : trimmed;
    };

    const seen = new Set<string>();

    return sourcePins
      .filter((pin) => Boolean(pin.imageUrl))
      .filter((pin) => {
        const dedupeKey = pin.id || pin.imageUrl || pin.key;
        if (seen.has(dedupeKey)) return false;
        seen.add(dedupeKey);
        return true;
      })
      .map((pin, index) => ({
        id: pin.id,
        mediaId: pin.mediaId ?? null,
        imageUrl: pin.imageUrl!,
        title: pin.title.trim() || null,
        altText: pin.altText.trim() || pin.title.trim() || pin.description.trim() || null,
        description: stripUrls(pin.description) || null,
        linkUrl: toAbsoluteLink(pin.linkUrl),
        taggedTopics: pin.taggedTopics
          .map((topic) => topic.trim())
          .filter(Boolean)
          .slice(0, 10),
        sortOrder: index,
      }));
  }

  async function save(overrideStatus?: string) {
    if (savingRef.current) return;
    if (!title.trim()) { setSaveError("Title is required"); return; }
    if (!categoryId) {
      setSaveError("Choose a category before saving the article.");
      document.getElementById("category-field")?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        const categoryField = document.getElementById("category-field");
        if (categoryField instanceof HTMLSelectElement) categoryField.focus();
      }, 120);
      return;
    }
    savingRef.current = true;
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
      const validPins = serializePins(pins);
      const pinsRes = await fetch(`/api/admin/articles/${savedId}/pins`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPins),
      });
      if (!pinsRes.ok) {
        const error = await pinsRes.json().catch(() => null);
        throw new Error(error?.error ? JSON.stringify(error.error) : "Failed to save Pinterest pins");
      }
      const pinsResult = await pinsRes.json().catch(() => null);

      setLastSaved(new Date());
      setPins((currentPins) => {
        const savedPins = Array.isArray(pinsResult?.pins) ? pinsResult.pins as Array<{ id: string; imageUrl: string }> : [];
        if (savedPins.length === 0) return currentPins;
        return currentPins.map((pin) => {
          if (pin.id || !pin.imageUrl) return pin;
          const savedPin = savedPins.find((item) => item.imageUrl === pin.imageUrl);
          return savedPin ? { ...pin, id: savedPin.id } : pin;
        });
      });
      setLastSavedKey(JSON.stringify({
        ...payload,
        pins: validPins,
      }));
      if (overrideStatus) setStatus(overrideStatus);
      if (isNew) router.replace(`/admin/articles/${data.id}/edit`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      savingRef.current = false;
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
  }, [isNew, buildPayload, currentSaveKey]);

  function toggleTag(id: string) {
    setSelectedTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugEdited) setSlug(value ? slugify(value) : "");
  }

  function scrollToChecklistTarget(item: SeoChecklistItem) {
    if (["metaTitle", "metaDescription"].includes(item.id)) setSeoOpen(true);
    if (item.id === "pinterestPins") setPinterestOpen(true);
    window.setTimeout(() => {
      const element = document.getElementById(item.targetId);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
        element.focus();
      }
    }, 80);
  }

  async function generateSeoFix(item: SeoChecklistItem) {
    if (!item.canGenerate || item.done) return;
    setGeneratingSeoItem(item.id);
    setSeoFixError(null);
    setSeoFixMessage(null);
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "seo-fix",
          field: item.id,
          title,
          excerpt,
          content,
          currentMetaTitle: metaTitle,
          currentMetaDescription: metaDescription,
          heroAlt: heroImage?.altText ?? "",
          pins,
          categories,
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "SEO generation failed");
      let changed = false;

      if (item.id === "title" && typeof data.title === "string") {
        handleTitleChange(data.title);
        changed = true;
      }
      if (item.id === "metaTitle" && typeof data.metaTitle === "string") {
        setSeoOpen(true);
        setMetaTitle(data.metaTitle);
        changed = true;
      }
      if (item.id === "metaDescription" && typeof data.metaDescription === "string") {
        setSeoOpen(true);
        setMetaDescription(data.metaDescription);
        changed = true;
      }
      if (item.id === "heroAlt" && heroImage?.id && typeof data.heroAlt === "string") {
        const altRes = await fetch(`/api/admin/media/${heroImage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ altText: data.heroAlt }),
        });
        if (!altRes.ok) throw new Error("Failed to save generated hero ALT");
        setHeroImage(await altRes.json());
        changed = true;
      }
      if (item.id === "categoryTags") {
        if (typeof data.categoryId === "string" && categories.some((c) => c.id === data.categoryId)) {
          setCategoryId(data.categoryId);
          changed = true;
        }
        if (Array.isArray(data.tagIds)) {
          const validTagIds = data.tagIds.filter((id: unknown): id is string =>
            typeof id === "string" && tags.some((tag) => tag.id === id)
          );
          if (validTagIds.length > 0) {
            setSelectedTags(validTagIds);
            changed = true;
          }
        }
      }
      if (item.id === "pinterestPins" && Array.isArray(data.pins)) {
        setPinterestOpen(true);
        const generatedPins = data.pins as Array<{
          index?: number;
          title?: string;
          altText?: string;
          description?: string;
          linkUrl?: string;
          taggedTopics?: string[];
        }>;
        const nextPins = pins.map((pin, index) => {
            const generated = generatedPins.find((p) => p.index === index);
            if (!generated) return pin;
            return {
              ...pin,
              title: generated.title || pin.title,
              altText: generated.altText || pin.altText,
              description: generated.description || pin.description,
              linkUrl: generated.linkUrl || pin.linkUrl,
              taggedTopics: generated.taggedTopics?.length ? generated.taggedTopics : pin.taggedTopics,
            };
        });
        changed = nextPins.some((pin, index) =>
          pin.title !== pins[index]?.title ||
          pin.altText !== pins[index]?.altText ||
          pin.description !== pins[index]?.description ||
          pin.linkUrl !== pins[index]?.linkUrl ||
          pin.taggedTopics.join(",") !== pins[index]?.taggedTopics.join(",")
        );
        if (changed) setPins(nextPins);
      }

      if (!changed) throw new Error(`AI returned no usable ${item.label} update. Try Generate SEO fix again.`);
      setSeoFixMessage(`Updated ${item.label}. Save draft to keep the change.`);
      scrollToChecklistTarget(item);
    } catch (e) {
      setSeoFixError(e instanceof Error ? e.message : "SEO generation failed");
    } finally {
      setGeneratingSeoItem(null);
    }
  }

  return (
    <div className="flex gap-6 items-start">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Title */}
        <input
          id="article-title-field"
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Article title..."
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
        <div id="article-editor-field">
          <TipTapEditor content={content} onChange={setContent} placeholder="Start writing your article..." />
        </div>

        {/* SEO section */}
        <div id="seo-fields-section" className="border border-gray-200 rounded-xl overflow-hidden">
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
                  id="meta-title-field"
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
                  id="meta-description-field"
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
                  placeholder="https://...  (leave blank for default)"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pinterest section */}
        <div id="pinterest-pins-section" className="border border-gray-200 rounded-xl overflow-hidden">
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
              <PinterestPins
                value={pins}
                onChange={setPins}
                articleId={articleId}
                articleContext={{
                  title,
                  slug,
                  excerpt,
                  content,
                  siteUrl: normalizedSiteUrl,
                  taggedTopics: filteredTags
                    .filter((tag) => selectedTags.includes(tag.id))
                    .map((tag) => tag.name),
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-72 shrink-0 space-y-4">
        <div className="sticky top-6 z-20 space-y-4">
          {/* Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
            {saveError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>
            )}
            {lastSaved && (
              <p className="text-xs text-gray-400">
                Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            {!lastSaved && !hasUnsavedChanges && !isNew && (
              <p className="text-xs text-gray-400">No changes yet</p>
            )}
            {hasUnsavedChanges && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                Unsaved changes
              </p>
            )}

            {status !== "PUBLISHED" ? (
              <>
                <button
                  type="button"
                  onClick={() => save()}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Save draft
                </button>
                <button
                  type="button"
                  onClick={() => save("PUBLISHED")}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  <Send size={15} />
                  Publish
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => save("PUBLISHED")}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Update
                </button>
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
              </div>
            )}

            {!isNew && status !== "PUBLISHED" && (
              <a
                href={`/preview/articles/${articleId}`}
                target="_blank"
                className="flex w-full items-center justify-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Eye size={15} />
                Preview
              </a>
            )}
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-y-auto bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-gray-700">SEO checklist</h3>
              <span className="text-xs text-gray-400">
                {completedSeoItems}/{seoChecklist.length}
              </span>
            </div>
            {seoFixError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{seoFixError}</p>
            )}
            {seoFixMessage && (
              <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{seoFixMessage}</p>
            )}
            <div className="space-y-2">
              {seoChecklist.map((item) => (
                <div key={item.id} className="rounded-lg border border-transparent p-2 hover:border-gray-100 hover:bg-gray-50">
                  <div className="flex items-start gap-2 text-xs">
                    {item.done ? (
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                    )}
                    <button
                      type="button"
                      onClick={() => scrollToChecklistTarget(item)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className={item.done ? "block font-medium text-gray-700" : "block font-medium text-gray-800"}>
                        {item.label}
                      </span>
                      {!item.done && <span className="mt-0.5 block text-gray-400">{item.hint}</span>}
                    </button>
                  </div>
                  {!item.done && item.canGenerate && (
                    <button
                      type="button"
                      onClick={() => generateSeoFix(item)}
                      disabled={generatingSeoItem !== null}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      {generatingSeoItem === item.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Sparkles size={13} />
                      )}
                      Generate SEO fix
                    </button>
                  )}
                  {!item.done && !item.canGenerate && (
                    <p className="mt-2 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-gray-400">
                      Manual step
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hero image */}
        <div id="hero-image-section" className="bg-white border border-gray-200 rounded-xl p-4">
          <ImageUpload value={heroImage} onChange={setHeroImage} label="Hero image" aspectRatio="aspect-video" />
        </div>

        {/* Excerpt */}
        <div id="excerpt-section" className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Excerpt</h3>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            placeholder="Brief summary shown in article cards..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          />
        </div>

        {/* Category */}
        <div id="category-section" className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Category</h3>
          <select
            id="category-field"
            value={categoryId}
            onChange={(e) => {
              const nextCategoryId = e.target.value;
              setCategoryId(nextCategoryId);
              setSelectedTags((current) => current.filter((tagId) =>
                tags.some((tag) => tag.id === tagId && tag.categoryId === nextCategoryId)
              ));
            }}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div id="tags-section" className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-gray-700">Tags</h3>
            {categoryId && (
              <span className="text-xs text-gray-400">{filteredTags.length} in category</span>
            )}
          </div>
          {!categoryId ? (
            <p className="text-xs text-gray-400">Choose a category to see its tags.</p>
          ) : filteredTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {filteredTags.map((t) => (
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
          ) : (
            <p className="text-xs text-gray-400">No tags for this category yet. Add tags in Taxonomy.</p>
          )}
        </div>

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

function stripUrls(value: string) {
  return value
    .replace(/\b(?:Visit|Read more|Learn more|See more)\s*:?\s*https?:\/\/\S+/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(?:Visit|Read more|Learn more|See more)(?:\s+at)?\s*:?\s*$/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildSeoChecklist({
  title,
  excerpt,
  heroImage,
  metaTitle,
  metaDescription,
  categoryId,
  selectedTags,
  pins,
  categories,
  tags,
}: {
  title: string;
  excerpt: string;
  heroImage: MediaItem | null;
  metaTitle: string;
  metaDescription: string;
  categoryId: string;
  selectedTags: string[];
  pins: PinItem[];
  categories: Category[];
  tags: Tag[];
}): SeoChecklistItem[] {
  const activeMetaTitle = metaTitle || title;
  const activeMetaDescription = metaDescription || excerpt;
  const hasMetaDescription = activeMetaDescription.trim().length > 0;

  return [
    {
      id: "title",
      label: "Article title",
      done: title.trim().length > 0 && title.length <= 70,
      hint: "Write a clear search-friendly title under 70 characters.",
      targetId: "article-title-field",
      canGenerate: true,
    },
    {
      id: "heroImage",
      label: "Hero image",
      done: Boolean(heroImage?.url),
      hint: "Add a full-width image for the article header.",
      targetId: "hero-image-section",
      canGenerate: false,
    },
    {
      id: "heroAlt",
      label: "Hero ALT",
      done: Boolean(heroImage?.altText?.trim()),
      hint: "Write ALT text for the hero image.",
      targetId: "hero-image-section",
      canGenerate: Boolean(heroImage?.url),
    },
    {
      id: "metaTitle",
      label: "Meta title",
      done: activeMetaTitle.trim().length > 0 && activeMetaTitle.length <= 60,
      hint: "Keep it filled and under 60 characters.",
      targetId: "meta-title-field",
      canGenerate: true,
    },
    {
      id: "metaDescription",
      label: "Meta description",
      done: hasMetaDescription && activeMetaDescription.length <= 160,
      hint: hasMetaDescription ? "Shorten it to 160 characters or less." : "Add a search-friendly meta description.",
      targetId: "meta-description-field",
      canGenerate: true,
    },
    {
      id: "categoryTags",
      label: "Category and tags",
      done: Boolean(categoryId) && selectedTags.length > 0,
      hint: "Choose one category and at least one tag.",
      targetId: categoryId ? "tags-section" : "category-field",
      canGenerate: categories.length > 0 || tags.length > 0,
    },
    {
      id: "pinterestPins",
      label: "Pinterest pins",
      done: pins.some((pin) =>
        pin.imageUrl &&
        pin.title.trim() &&
        pin.description.trim() &&
        pin.linkUrl.trim() &&
        pin.taggedTopics.length > 0
      ),
      hint: "Add a pin with title, description, link, and tagged topics.",
      targetId: "pinterest-pins-section",
      canGenerate: pins.some((pin) => pin.imageUrl),
    },
  ];
}
