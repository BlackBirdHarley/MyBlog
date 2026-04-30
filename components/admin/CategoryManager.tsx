"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count: { articles: number };
}

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!newName.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDesc || null }),
    });
    if (res.ok) {
      const cat = await res.json();
      setCategories((prev) => [...prev, { ...cat, _count: { articles: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewDesc("");
      setAdding(false);
    }
    setLoading(false);
  }

  async function update(id: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, description: editDesc || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...updated, _count: c._count } : c)));
      setEditingId(null);
    }
    setLoading(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this category? Articles will be uncategorised.")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="max-w-xl">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        {categories.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">No categories yet</p>
        ) : (
          <ul>
            {categories.map((cat, i) => (
              <li key={cat.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                {editingId === cat.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      autoFocus
                    />
                    <button onClick={() => update(cat.id)} disabled={loading} className="p-1 text-green-600 hover:bg-green-50 rounded-md">
                      <Check size={15} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md">
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-400">{cat._count.articles} article{cat._count.articles !== 1 ? "s" : ""} · /{cat.slug}</p>
                    </div>
                    <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); setEditDesc(cat.description ?? ""); }} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => remove(cat.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {adding ? (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") create(); if (e.key === "Escape") setAdding(false); }}
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <div className="flex gap-2">
            <button onClick={create} disabled={loading || !newName.trim()} className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
              Add category
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-dashed border-gray-300 rounded-xl px-4 py-2.5 hover:border-gray-400 transition-colors">
          <Plus size={15} />
          Add category
        </button>
      )}
    </div>
  );
}
