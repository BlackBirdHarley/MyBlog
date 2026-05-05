"use client";

import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { PinImageUpload } from "./PinImageUpload";
import { useState } from "react";

export interface PinItem {
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
  const [aiMode, setAiMode] = useState<"pin" | "marketing">("pin");
  const [aiPrompt, setAiPrompt] = useState("");
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<{ title: string; tags: string[]; articleUrl: string } | null>(null);
  const siteUrl = articleContext?.siteUrl?.replace(/\/$/, "") ?? "";
  const defaultLink = articleContext?.slug
    ? `${siteUrl}/blog/${articleContext.slug}`
    : "";
  const defaultTopics = articleContext?.taggedTopics ?? [];

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
          mode: aiMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Pin generation failed");
      onChange([
        ...value,
        {
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
        },
      ]);
      setGeneratedSummary({
        title: data.pin.title ?? "Generated pin",
        tags: Array.isArray(data.pin.tags) ? data.pin.tags : [],
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
          <div className="flex rounded-lg bg-white p-1 text-xs font-medium shadow-sm ring-1 ring-gray-200">
            <button
              type="button"
              onClick={() => setAiMode("pin")}
              className={`rounded-md px-2.5 py-1.5 ${aiMode === "pin" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-800"}`}
            >
              Pin
            </button>
            <button
              type="button"
              onClick={() => setAiMode("marketing")}
              className={`rounded-md px-2.5 py-1.5 ${aiMode === "marketing" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-800"}`}
            >
              Marketing
            </button>
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
                onClick={() => remove(pin.key)}
                className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
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
    </div>
  );
}
