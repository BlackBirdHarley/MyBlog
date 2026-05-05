"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, FileText, Layers3, Plus, Tag, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
  categoryId: string | null;
  tags: { id: string; name: string }[];
}

interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tags: { id: string; name: string; slug: string; _count: { articles: number } }[];
  _count: { articles: number };
}

interface TaxonomyManagerProps {
  initialCategories: CategorySummary[];
  articles: ArticleSummary[];
}

type Selection = "all" | string;

export function TaxonomyManager({ initialCategories, articles }: TaxonomyManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [selected, setSelected] = useState<Selection>(initialCategories[0]?.id ?? "all");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const selectedCategory = categories.find((category) => category.id === selected) ?? null;

  const filteredArticles = useMemo(() => {
    if (selected === "all") return articles;
    return articles.filter((article) => article.categoryId === selected);
  }, [articles, selected]);

  const totalTags = categories.reduce((sum, category) => sum + category.tags.length, 0);

  async function createCategory() {
    if (!newCategoryName.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName,
          description: newCategoryDescription || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readErrorMessage(data, "Could not create category."));
      const category = data;
      const next = { ...category, tags: [], _count: { articles: 0 } };
      setCategories((prev) => [...prev, next].sort((a, b) => a.name.localeCompare(b.name)));
      setSelected(next.id);
      setNewCategoryName("");
      setNewCategoryDescription("");
      setMessage("Category created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create category.");
    } finally {
      setLoading(false);
    }
  }

  async function createTag() {
    if (!newTagName.trim() || !selectedCategory) return;
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTagName, categoryId: selectedCategory.id }),
    });
    if (res.ok) {
      const tag = await res.json();
      setCategories((prev) =>
        prev.map((category) =>
          category.id === selectedCategory.id
            ? {
                ...category,
                tags: [...category.tags, { ...tag, _count: { articles: 0 } }].sort((a, b) => a.name.localeCompare(b.name)),
              }
            : category
        )
      );
      setNewTagName("");
      setMessage("Tag added to category.");
    } else {
      setMessage("Could not create tag.");
    }
    setLoading(false);
  }

  async function removeTag(tagId: string) {
    setMessage("");
    const res = await fetch(`/api/admin/tags/${tagId}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) =>
        prev.map((category) => ({ ...category, tags: category.tags.filter((tag) => tag.id !== tagId) }))
      );
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Could not delete tag.");
    }
  }

  async function removeCategory(categoryId: string) {
    if (!confirm("Delete this category? Articles and tags will stay, but lose this category.")) return;
    setMessage("");
    const res = await fetch(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) => prev.filter((category) => category.id !== categoryId));
      setSelected("all");
    } else {
      setMessage("Could not delete category.");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:sticky xl:top-8 xl:self-start">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white">
              <Layers3 size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Taxonomy</h2>
              <p className="mt-0.5 text-xs text-gray-500">{categories.length} categories / {totalTags} tags</p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-100 p-3">
          <button
            type="button"
            onClick={() => setSelected("all")}
            className={navItemClass(selected === "all")}
          >
            <span className="flex min-w-0 items-center gap-2">
              <FileText size={15} />
              <span>All articles</span>
            </span>
            <span className={countClass(selected === "all")}>{articles.length}</span>
          </button>
        </div>

        <div className="max-h-[460px] overflow-y-auto p-3">
          {categories.map((category) => {
            const active = selected === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelected(category.id)}
                className={navItemClass(active)}
              >
                <span className="min-w-0 text-left">
                  <span className="block truncate">{category.name}</span>
                  <span className={cn("mt-0.5 block truncate text-[11px]", active ? "text-gray-300" : "text-gray-400")}>
                    {category.tags.length} tag{category.tags.length !== 1 ? "s" : ""} / {category.slug}
                  </span>
                </span>
                <span className={countClass(active)}>{category._count.articles}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">New category</p>
          <div className="space-y-2">
            <input
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Category name"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              onKeyDown={(event) => { if (event.key === "Enter") createCategory(); }}
            />
            <input
              value={newCategoryDescription}
              onChange={(event) => setNewCategoryDescription(event.target.value)}
              placeholder="Description"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              type="button"
              onClick={createCategory}
              disabled={loading || !newCategoryName.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              <Plus size={15} />
              Add category
            </button>
          </div>
        </div>
      </aside>

      <section className="min-w-0 space-y-6">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 bg-gray-50 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {selectedCategory ? "Selected category" : "Article scope"}
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                {selectedCategory?.name ?? "All articles"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {selectedCategory?.description || `${filteredArticles.length} article${filteredArticles.length !== 1 ? "s" : ""} in this view.`}
              </p>
            </div>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => removeCategory(selectedCategory.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={15} />
                Delete category
              </button>
            )}
          </div>

          {selectedCategory && (
            <div className="border-b border-gray-100 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-900">Tags in this category</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {selectedCategory.tags.length}
                </span>
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedCategory.tags.length > 0 ? selectedCategory.tags.map((tag) => (
                  <span key={tag.id} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
                    <Tag size={13} className="text-gray-400" />
                    {tag.name}
                    <span className="text-xs text-gray-400">({tag._count.articles})</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag.id)}
                      className="ml-0.5 text-gray-300 hover:text-red-500"
                    >
                      <X size={13} />
                    </button>
                  </span>
                )) : (
                  <p className="text-sm text-gray-400">No tags in this category yet.</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={newTagName}
                  onChange={(event) => setNewTagName(event.target.value)}
                  placeholder={`New tag for ${selectedCategory.name}`}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  onKeyDown={(event) => { if (event.key === "Enter") createTag(); }}
                />
                <button
                  type="button"
                  onClick={createTag}
                  disabled={loading || !newTagName.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? <Check size={15} /> : <Plus size={15} />}
                  Add tag
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className="border-b border-gray-100 px-5 py-3 text-sm text-gray-500">{message}</div>
          )}

          <div className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-900">Articles</h3>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                {filteredArticles.length}
              </span>
            </div>
            {filteredArticles.length > 0 ? (
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                {filteredArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/admin/articles/${article.id}/edit`}
                    className="block px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{article.title}</p>
                        <p className="mt-1 truncate text-xs text-gray-400">/{article.slug}</p>
                        {article.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {article.tags.map((tag) => (
                              <span key={tag.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        {article.status.toLowerCase()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
                No articles in this view.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function navItemClass(active: boolean) {
  return cn(
    "mb-1 flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
    active ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
  );
}

function countClass(active: boolean) {
  return cn(
    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
    active ? "bg-white/15 text-white" : "bg-gray-100 text-gray-500"
  );
}

function readErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;
  const error = (data as { error?: unknown }).error;
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return fallback;

  const fieldErrors = (error as { fieldErrors?: Record<string, string[]> }).fieldErrors;
  if (fieldErrors) {
    const messages = Object.entries(fieldErrors)
      .flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`));
    if (messages.length > 0) return messages.join("; ");
  }

  const formErrors = (error as { formErrors?: string[] }).formErrors;
  if (formErrors?.length) return formErrors.join("; ");

  return fallback;
}
