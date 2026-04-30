"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TipTapEditor } from "@/components/admin/editor/TipTapEditor";
import { Loader2, Check } from "lucide-react";

interface StaticPageFormProps {
  pageKey: string;
  initialTitle: string;
  initialContent: object;
}

export function StaticPageForm({ pageKey, initialTitle, initialContent }: StaticPageFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState<object>(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/pages/${pageKey}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    }
  }

  const field = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white";

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Page title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={field}
          placeholder="About"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <TipTapEditor content={content} onChange={setContent} placeholder="Start writing…" />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={save}
          disabled={saving || !title.trim()}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null}
          {saved ? "Saved!" : "Save page"}
        </button>
      </div>
    </div>
  );
}
