"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, ChevronDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/react";
import { generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { ImageAlignExtension } from "./extensions/ImageAlign";

export function AIGeneratePanel({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [instructions, setInstructions] = useState("");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function generate() {
    if (!title.trim()) { setError("Enter a title"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, keywords, instructions, length }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const { html } = await res.json();

      // Convert HTML → TipTap JSON (runs in browser, DOM available)
      const json = generateJSON(`<h1>${title}</h1>${html}`, [
        StarterKit.configure({ link: false }),
        ImageAlignExtension,
      ]);
      editor.commands.setContent(json);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        title="Generate with AI"
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
          open
            ? "bg-violet-100 text-violet-700"
            : "text-violet-600 hover:bg-violet-50 hover:text-violet-700"
        )}
      >
        <Sparkles size={13} />
        AI
        <ChevronDown size={10} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Sparkles size={14} className="text-violet-500" />
              Generate article
            </p>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setOpen(false); }}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Article title <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Best hiking boots for beginners"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Keywords</label>
              <input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="hiking, trail, beginner, boots"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Instructions</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={2}
                placeholder="Focus on waterproof options, include care tips…"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Length</label>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {(["short", "medium", "long"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setLength(l); }}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-colors",
                      length === l ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {length === "short" ? "600–900" : length === "medium" ? "1200–1700" : "2000–2800"} words
              </p>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); generate(); }}
            disabled={loading || !title.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Generating…</>
            ) : (
              <><Sparkles size={14} /> Generate</>
            )}
          </button>

          {loading && (
            <p className="text-xs text-gray-400 text-center">
              Usually takes 15–40 seconds…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
