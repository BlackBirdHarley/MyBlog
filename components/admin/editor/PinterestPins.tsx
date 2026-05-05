"use client";

import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { PinImageUpload } from "./PinImageUpload";
import { useState } from "react";

export interface PinItem {
  id?: string;
  key: string;
  imageUrl: string | null;
  title: string;
  altText: string;
  description: string;
  linkUrl: string;
  taggedTopics: string[];
}

interface PinterestPinsProps {
  value: PinItem[];
  onChange: (pins: PinItem[]) => void;
  articleId?: string;
  articleContext?: {
    title: string;
    slug: string;
    excerpt: string;
    content: object;
    taggedTopics: string[];
    siteUrl?: string | null;
  };
}

export function PinterestPins({ value, onChange, articleId, articleContext }: PinterestPinsProps) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<{ title: string; tags: string[]; articleUrl: string } | null>(null);
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const siteUrl = articleContext?.siteUrl?.replace(/\/$/, "") ?? "";
  const defaultLink = articleContext?.slug
    ? `${siteUrl}/blog/${articleContext.slug}`
    : "";
  const defaultTopics = articleContext?.taggedTopics ?? [];
  const pendingDeletePin = value.find((pin) => pin.key === pendingDeleteKey);
  const canDeletePin = deleteConfirmText === "delete pin";

  function addPin() {
    onChange([...value, {
      key: crypto.randomUUID(),
      imageUrl: null,
      title: articleContext?.title ?? "",
      altText: "",
      description: "",
      linkUrl: defaultLink,
      taggedTopics: defaultTopics,
    }]);
  }

  function remove(key: string) {
    onChange(value.filter((p) => p.key !== key));
    setPendingDeleteKey(null);
    setDeleteConfirmText("");
  }

  function requestRemove(key: string) {
    setPendingDeleteKey(key);
    setDeleteConfirmText("");
  }

  function update(key: string, patch: Partial<PinItem>) {
    onChange(value.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  async function generatePin() {
    setGenerating(true);
    setAiError(null);
    setGeneratedSummary(null);
    try {
      const res = await fetch("/api/admin/ai/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          ...articleContext,
          prompt: aiPrompt,
          referenceImageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Pin generation failed");
      const generatedPin: PinItem = {
        id: data.pin.id,
        key: crypto.randomUUID(),
        imageUrl: data.pin.imageUrl,
        altText: data.pin.altText ?? "",
        description: data.pin.description ?? "",
        title: data.pin.title ?? articleContext?.title ?? "",
        linkUrl: data.pin.linkUrl ?? data.pin.articleUrl ?? defaultLink,
        taggedTopics: Array.isArray(data.pin.taggedTopics)
          ? data.pin.taggedTopics
          : Array.isArray(data.pin.tags)
            ? data.pin.tags
            : defaultTopics,
      };
      let nextPins = [
        ...value,
        generatedPin,
      ];

      if (articleId) {
        const saveRes = await fetch(`/api/admin/articles/${articleId}/pins`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextPins
            .filter((pin) => pin.imageUrl)
            .map((pin, index) => ({
              id: pin.id,
              imageUrl: pin.imageUrl,
              title: pin.title || null,
              altText: pin.altText || null,
              description: pin.description || null,
              linkUrl: pin.linkUrl || null,
              taggedTopics: pin.taggedTopics,
              sortOrder: index,
            }))),
        });
        const saved = await saveRes.json().catch(() => null);
        if (!saveRes.ok) throw new Error(saved?.error ? JSON.stringify(saved.error) : "Generated pin was not saved");
        if (Array.isArray(saved?.pins)) {
          nextPins = saved.pins.map((pin: {
            id: string;
            imageUrl: string;
            title?: string | null;
            altText?: string | null;
            description?: string | null;
            linkUrl?: string | null;
            taggedTopics?: string[];
          }) => ({
            id: pin.id,
            key: crypto.randomUUID(),
            imageUrl: pin.imageUrl,
            title: pin.title ?? "",
            altText: pin.altText ?? "",
            description: pin.description ?? "",
            linkUrl: pin.linkUrl ?? defaultLink,
            taggedTopics: pin.taggedTopics ?? [],
          }));
        }
      }

      onChange(nextPins);
      setGeneratedSummary({
        title: data.pin.title ?? "Generated pin",
        tags: Array.isArray(data.pin.taggedTopics)
          ? data.pin.taggedTopics
          : Array.isArray(data.pin.tags)
            ? data.pin.tags
            : [],
        articleUrl: data.pin.articleUrl ?? "",
      });
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Pin generation failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#dfe8dc] bg-[#f8fbf7] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-800">AI pin studio</p>
            <p className="text-xs text-gray-500">Generate a pin image, title, description, topics, and article link.</p>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-[80px_minmax(0,1fr)]">
          <PinImageUpload
            value={referenceImageUrl}
            altText="AI reference image"
            onChange={(url) => setReferenceImageUrl(url)}
          />
          <div className="space-y-2">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              placeholder="Prompt or direction. You can upload a product image or a successful pin as the reference on the left."
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              type="button"
              onClick={generatePin}
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              Generate pin
            </button>
          </div>
        </div>

        {aiError && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{aiError}</p>}
        {generatedSummary && (
          <div className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-500 ring-1 ring-gray-100">
            <span className="font-medium text-gray-700">{generatedSummary.title}</span>
            {generatedSummary.articleUrl && <span className="block truncate">Link: {generatedSummary.articleUrl}</span>}
            {generatedSummary.tags.length > 0 && <span className="block truncate">Tags: {generatedSummary.tags.join(", ")}</span>}
          </div>
        )}
      </div>

      {value.map((pin, i) => (
        <div key={pin.key} className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl border border-gray-200">
          <PinImageUpload
            value={pin.imageUrl}
            altText={pin.altText}
            onChange={(url) => update(pin.key, { imageUrl: url })}
          />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Pin {i + 1}</span>
              <button
                type="button"
                onClick={() => requestRemove(pin.key)}
                className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                title="Delete pin"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <textarea
              value={pin.description}
              onChange={(e) => update(pin.key, { description: e.target.value })}
              rows={3}
              placeholder="Pin description..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none bg-white"
            />
            <input
              value={pin.title}
              onChange={(e) => update(pin.key, { title: e.target.value })}
              placeholder="Pinterest title"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            />
            <input
              value={pin.linkUrl}
              onChange={(e) => update(pin.key, { linkUrl: e.target.value })}
              placeholder={defaultLink || "Pinterest link"}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            />
            <input
              value={pin.taggedTopics.join(", ")}
              onChange={(e) => update(pin.key, {
                taggedTopics: e.target.value
                  .split(",")
                  .map((topic) => topic.trim())
                  .filter(Boolean)
                  .slice(0, 10),
              })}
              placeholder="Tagged topics, separated by commas"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addPin}
        className="flex items-center justify-center gap-2 w-full text-sm text-gray-500 hover:text-gray-900 border border-dashed border-gray-300 rounded-xl px-3 py-2.5 hover:border-gray-400 transition-colors"
      >
        <Plus size={14} />
        Add pin
      </button>

      {pendingDeletePin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/35 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl ring-1 ring-gray-200">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <Trash2 size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">Delete this pin?</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  This removes the pin from the article after you save or update it. Type <span className="font-semibold text-gray-700">delete pin</span> to confirm.
                </p>
              </div>
            </div>

            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoFocus
              placeholder="delete pin"
              className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingDeleteKey(null);
                  setDeleteConfirmText("");
                }}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => remove(pendingDeletePin.key)}
                disabled={!canDeletePin}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete pin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
