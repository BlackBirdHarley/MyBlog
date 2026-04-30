"use client";

import { useEffect, useState, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import {
  AlignLeft, AlignCenter, AlignRight, Trash2, Upload, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageAlign, ImageSize } from "./extensions/ImageAlign";

type ActiveCtx = "image" | "table" | "hr" | null;

function Divider() {
  return <div className="w-px h-4 bg-indigo-200 mx-0.5 shrink-0" />;
}

function Btn({
  active, danger, onClick, title, children,
}: {
  active?: boolean; danger?: boolean; onClick: () => void;
  title?: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        "px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1",
        danger  ? "text-red-500 hover:bg-red-100 hover:text-red-700"
        : active ? "bg-indigo-600 text-white"
                 : "text-indigo-700 hover:bg-indigo-100"
      )}
    >
      {children}
    </button>
  );
}

// ─── Image controls ────────────────────────────────────────────────────────────
function ImageControls({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const align = (editor.getAttributes("image").align ?? "center") as ImageAlign;
  const size  = (editor.getAttributes("image").size  ?? "full")   as ImageSize;

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const media = await res.json();
      editor.chain().focus().updateAttributes("image", { src: media.url }).run();
    } finally { setUploading(false); }
  }

  return (
    <>
      <span className="text-xs text-indigo-400 font-medium mr-1">Image</span>

      <Btn active={align === "left"}   onClick={() => editor.chain().focus().updateAttributes("image", { align: "left" }).run()}   title="Float left"><AlignLeft  size={13} /></Btn>
      <Btn active={align === "center"} onClick={() => editor.chain().focus().updateAttributes("image", { align: "center" }).run()} title="Full width"><AlignCenter size={13} /></Btn>
      <Btn active={align === "right"}  onClick={() => editor.chain().focus().updateAttributes("image", { align: "right" }).run()}  title="Float right"><AlignRight size={13} /></Btn>

      <Divider />

      {(["sm","md","lg","full"] as ImageSize[]).map((s) => (
        <Btn key={s} active={size === s}
          onClick={() => editor.chain().focus().updateAttributes("image", { size: s }).run()}
          title={s === "sm" ? "Small" : s === "md" ? "Medium" : s === "lg" ? "Large" : "Full"}
        >
          {s === "sm" ? "S" : s === "md" ? "M" : s === "lg" ? "L" : "Full"}
        </Btn>
      ))}

      <Divider />

      <Btn onClick={() => fileInputRef.current?.click()} title="Replace image">
        {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
        Replace
      </Btn>
      <Btn danger onClick={() => editor.chain().focus().deleteSelection().run()} title="Delete image">
        <Trash2 size={13} /> Delete
      </Btn>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </>
  );
}

// ─── Table controls ────────────────────────────────────────────────────────────
function TableControls({ editor }: { editor: Editor }) {
  return (
    <>
      <span className="text-xs text-indigo-400 font-medium mr-1">Table</span>
      <Btn onClick={() => editor.chain().focus().addRowBefore().run()} title="Add row above">+ Row ↑</Btn>
      <Btn onClick={() => editor.chain().focus().addRowAfter().run()}  title="Add row below">+ Row ↓</Btn>
      <Btn onClick={() => editor.chain().focus().deleteRow().run()}    title="Delete row"><Trash2 size={12} /> Row</Btn>
      <Divider />
      <Btn onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add column left">+ Col ←</Btn>
      <Btn onClick={() => editor.chain().focus().addColumnAfter().run()}  title="Add column right">+ Col →</Btn>
      <Btn onClick={() => editor.chain().focus().deleteColumn().run()}    title="Delete column"><Trash2 size={12} /> Col</Btn>
      <Divider />
      <Btn danger onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table">
        <Trash2 size={13} /> Delete table
      </Btn>
    </>
  );
}

// ─── HR controls ──────────────────────────────────────────────────────────────
function HRControls({ editor }: { editor: Editor }) {
  return (
    <>
      <span className="text-xs text-indigo-400 font-medium mr-1">Horizontal rule</span>
      <Btn danger onClick={() => editor.chain().focus().deleteSelection().run()}>
        <Trash2 size={13} /> Delete
      </Btn>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function EditorBubbleMenus({ editor }: { editor: Editor }) {
  const [ctx, setCtx] = useState<ActiveCtx>(null);

  useEffect(() => {
    function update() {
      if (editor.isActive("image")) {
        setCtx("image");
      } else if (editor.isActive("table")) {
        setCtx("table");
      } else {
        const { selection } = editor.state;
        if (selection instanceof NodeSelection && selection.node.type.name === "horizontalRule") {
          setCtx("hr");
        } else {
          setCtx(null);
        }
      }
    }

    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    update();

    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!ctx) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b border-indigo-100 bg-indigo-50 animate-in fade-in duration-100">
      {ctx === "image" && <ImageControls editor={editor} />}
      {ctx === "table" && <TableControls editor={editor} />}
      {ctx === "hr"    && <HRControls    editor={editor} />}
    </div>
  );
}
