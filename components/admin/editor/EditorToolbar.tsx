"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Minus, Heading2, Heading3, Undo, Redo, Link2,
  Table2, AlertCircle, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AffiliateLinkPicker } from "./AffiliateLinkPicker";
import { ImageInsertPanel } from "./ImageInsertPanel";
import { AIGeneratePanel } from "./AIGeneratePanel";
import { useState, useRef, useEffect } from "react";
import type { CalloutType } from "./extensions/Callout";

interface ToolbarProps {
  editor: Editor | null;
}

function Btn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded-md transition-colors text-gray-500",
        active ? "bg-gray-200 text-gray-900" : "hover:bg-gray-100 hover:text-gray-900",
        disabled && "opacity-30 pointer-events-none"
      )}
    >
      {children}
    </button>
  );
}

const CALLOUT_OPTIONS: { type: CalloutType; label: string; color: string }[] = [
  { type: "tip",     label: "✅ Tip",     color: "text-green-700" },
  { type: "warning", label: "⚠️ Warning", color: "text-amber-700" },
  { type: "info",    label: "ℹ️ Info",    color: "text-blue-700"  },
  { type: "note",    label: "📝 Note",    color: "text-gray-700"  },
];

function CalloutDropdown({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        title="Insert callout"
        className={cn(
          "flex items-center gap-0.5 p-1.5 rounded-md transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-900",
          editor.isActive("callout") && "bg-gray-200 text-gray-900"
        )}
      >
        <AlertCircle size={15} />
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-32.5 py-1">
          {CALLOUT_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().insertCallout(opt.type).run();
                setOpen(false);
              }}
              className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50", opt.color)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditorToolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt("URL:", editor.getAttributes("link").href ?? "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50">
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
        <Bold size={15} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
        <Italic size={15} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
        <Strikethrough size={15} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
        <Code size={15} />
      </Btn>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
        <Heading2 size={15} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
        <Heading3 size={15} />
      </Btn>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
        <List size={15} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
        <ListOrdered size={15} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
        <Quote size={15} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
        <Minus size={15} />
      </Btn>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Regular link */}
      <Btn onClick={setLink} active={editor.isActive("link")} title="Regular link">
        <Link2 size={15} />
      </Btn>

      {/* Affiliate link picker — the key new button */}
      <AffiliateLinkPicker editor={editor} />

      <ImageInsertPanel editor={editor} />
      <Btn onClick={insertTable} title="Table">
        <Table2 size={15} />
      </Btn>
      <CalloutDropdown editor={editor} />

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <Undo size={15} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo size={15} />
      </Btn>

      <div className="flex-1" />
      <AIGeneratePanel editor={editor} />
    </div>
  );
}
