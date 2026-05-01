"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  category: { id: string; name: string } | null;
  _count: { articles: number };
}

interface TagManagerProps {
  initialTags: Tag[];
  categories: Category[];
}

export function TagManager({ initialTags, categories }: TagManagerProps) {
  const [tags, setTags] = useState(initialTags);
  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [removeError, setRemoveError] = useState("");

  async function create() {
    if (!newName.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, categoryId: newCategoryId || null }),
    });
    if (res.ok) {
      const tag = await res.json();
      setTags((prev) =>
        [...prev, { ...tag, _count: { articles: 0 } }].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewName("");
      setNewCategoryId("");
    }
    setLoading(false);
  }

  async function remove(id: string) {
    setRemoveError("");
    const res = await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTags((prev) => prev.filter((t) => t.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      setRemoveError(data.error ?? "Failed to delete tag");
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex flex-wrap gap-2 mb-6">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5"
          >
            {tag.category && (
              <span className="text-[10px] font-semibold text-[#FF9B7A] uppercase tracking-wide">
                {tag.category.name}
              </span>
            )}
            <span className="text-sm text-gray-700">{tag.name}</span>
            <span className="text-xs text-gray-400">({tag._count.articles})</span>
            <button
              onClick={() => remove(tag.id)}
              className="text-gray-300 hover:text-red-500 ml-0.5 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ))}
        {tags.length === 0 && <p className="text-sm text-gray-400">No tags yet</p>}
      </div>
      {removeError && <p className="text-xs text-red-600 mb-3">{removeError}</p>}

      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New tag name…"
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
          onKeyDown={(e) => { if (e.key === "Enter") create(); }}
        />
        {categories.length > 0 && (
          <select
            value={newCategoryId}
            onChange={(e) => setNewCategoryId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-600"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <button
          onClick={create}
          disabled={loading || !newName.trim()}
          className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          <Plus size={15} />
          Add
        </button>
      </div>
    </div>
  );
}
