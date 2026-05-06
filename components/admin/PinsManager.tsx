"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ExternalLink, Filter, ImageIcon, Loader2, Plus, X } from "lucide-react";

interface Board {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count: { pins: number };
}

interface ArticleOption {
  id: string;
  title: string;
  slug: string;
  _count: { pins: number };
}

interface PinRecord {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  linkUrl: string | null;
  taggedTopics: string[];
  createdAt: string;
  boardId: string | null;
  board: { id: string; name: string } | null;
  article: { id: string; title: string; slug: string };
}

export function PinsManager({
  pins,
  boards,
  articles,
  selectedArticleId,
  selectedBoardId,
}: {
  pins: PinRecord[];
  boards: Board[];
  articles: ArticleOption[];
  selectedArticleId: string;
  selectedBoardId: string;
}) {
  const router = useRouter();
  const [boardName, setBoardName] = useState("");
  const [boardDescription, setBoardDescription] = useState("");
  const [boardSaving, setBoardSaving] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  const activeBoards = useMemo(() => boards.filter((board) => board.isActive), [boards]);

  function updateFilter(next: { articleId?: string; boardId?: string }) {
    const params = new URLSearchParams();
    const articleId = next.articleId ?? selectedArticleId;
    const boardId = next.boardId ?? selectedBoardId;
    if (articleId) params.set("articleId", articleId);
    if (boardId) params.set("boardId", boardId);
    const query = params.toString();
    router.push(query ? `/admin/pins?${query}` : "/admin/pins");
  }

  async function createBoard() {
    if (!boardName.trim()) {
      setBoardError("Board name is required.");
      return;
    }
    setBoardSaving(true);
    setBoardError(null);
    try {
      const res = await fetch("/api/admin/pin-boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: boardName, description: boardDescription }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readError(data, "Failed to create board."));
      setBoardName("");
      setBoardDescription("");
      router.refresh();
    } catch (error) {
      setBoardError(error instanceof Error ? error.message : "Failed to create board.");
    } finally {
      setBoardSaving(false);
    }
  }

  async function toggleBoard(board: Board) {
    await fetch(`/api/admin/pin-boards/${board.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !board.isActive }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
            <Filter size={16} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
            <p className="text-xs text-gray-400">Show all pins or narrow them by article and board.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">Article</span>
            <select
              value={selectedArticleId}
              onChange={(event) => updateFilter({ articleId: event.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">All articles</option>
              {articles.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title} ({article._count.pins})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500">Board</span>
            <select
              value={selectedBoardId}
              onChange={(event) => updateFilter({ boardId: event.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">All boards</option>
              <option value="unassigned">No board</option>
              {activeBoards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name} ({board._count.pins})
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Pinterest pins</h2>
              <p className="text-xs text-gray-400">{pins.length} pin{pins.length !== 1 ? "s" : ""} in this view</p>
            </div>
          </div>

          {pins.length > 0 ? (
            <div className="grid gap-4 p-5 sm:grid-cols-2 2xl:grid-cols-3">
              {pins.map((pin) => (
                <article key={pin.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="relative aspect-2/3 bg-gray-100">
                    {pin.imageUrl ? (
                      <img src={pin.imageUrl} alt={pin.title ?? "Pinterest pin"} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <ImageIcon size={26} />
                      </div>
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-gray-700 shadow-sm">
                      {pin.board?.name ?? "No board"}
                    </span>
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{pin.title || "Untitled pin"}</h3>
                      <Link href={`/admin/articles/${pin.article.id}/edit`} className="mt-1 block truncate text-xs text-gray-400 hover:text-gray-700">
                        {pin.article.title}
                      </Link>
                    </div>
                    {pin.description && <p className="line-clamp-3 text-xs leading-5 text-gray-500">{pin.description}</p>}
                    {pin.board?.name && (
                      <p className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600">
                        Board: {pin.board.name}
                      </p>
                    )}
                    {pin.taggedTopics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {pin.taggedTopics.slice(0, 6).map((topic) => (
                          <span key={topic} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 border-t border-gray-100 pt-3">
                      <Link
                        href={`/admin/articles/${pin.article.id}/edit`}
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Edit article
                      </Link>
                      {pin.linkUrl && (
                        <a
                          href={pin.linkUrl}
                          target="_blank"
                          className="rounded-lg border border-gray-200 px-3 py-2 text-gray-500 hover:bg-gray-50"
                          title="Open pin link"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 px-5 py-24 text-center">
              <ImageIcon size={24} className="text-gray-300" />
              <p className="text-sm text-gray-400">No pins match these filters.</p>
            </div>
          )}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Add board</h2>
            <p className="mt-1 text-xs text-gray-400">Boards are chosen inside each pin while editing an article.</p>
            <div className="mt-4 space-y-2">
              <input
                value={boardName}
                onChange={(event) => setBoardName(event.target.value)}
                placeholder="Board name"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <textarea
                value={boardDescription}
                onChange={(event) => setBoardDescription(event.target.value)}
                rows={2}
                placeholder="Optional notes"
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              {boardError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{boardError}</p>}
              <button
                type="button"
                onClick={createBoard}
                disabled={boardSaving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {boardSaving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Add board
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Boards</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {boards.length > 0 ? boards.map((board) => (
                <div key={board.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{board.name}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{board._count.pins} pin{board._count.pins !== 1 ? "s" : ""}</p>
                    {board.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{board.description}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleBoard(board)}
                    className={`shrink-0 rounded-lg p-2 ${
                      board.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"
                    }`}
                    title={board.isActive ? "Active" : "Inactive"}
                  >
                    {board.isActive ? <Check size={14} /> : <X size={14} />}
                  </button>
                </div>
              )) : (
                <div className="px-4 py-10 text-center text-sm text-gray-400">No boards yet.</div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function readError(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;
  const error = (data as { error?: unknown }).error;
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return fallback;
  const fieldErrors = (error as { fieldErrors?: Record<string, string[]> }).fieldErrors;
  if (!fieldErrors) return fallback;
  const messages = Object.entries(fieldErrors).flatMap(([field, values]) =>
    values.map((value) => `${field}: ${value}`)
  );
  return messages.join("; ") || fallback;
}
