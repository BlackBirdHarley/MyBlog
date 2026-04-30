"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { AffiliateLinkExtension } from "./extensions/AffiliateLink";
import { CalloutExtension } from "./extensions/Callout";
import { ImageAlignExtension } from "./extensions/ImageAlign";
import { EditorToolbar } from "./EditorToolbar";
import { EditorBubbleMenus } from "./EditorBubbleMenus";
import { useEffect, useRef } from "react";

interface TipTapEditorProps {
  content: object;
  onChange: (content: object) => void;
  placeholder?: string;
}

export function TipTapEditor({ content, onChange, placeholder }: TipTapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "nofollow noopener", target: "_blank" } },
      }),
      ImageAlignExtension.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      AffiliateLinkExtension,
      CalloutExtension,
    ],
    content,
    onUpdate({ editor }) {
      const json = editor.getJSON();
      prevContent.current = json; // mark as editor-originated so the effect skips setContent
      onChange(json);
    },
    editorProps: {
      attributes: {
        class: [
          "prose prose-gray max-w-none focus:outline-none min-h-[400px] px-6 py-5 flow-root",
          "[&_.affiliate-link]:text-rose-600 [&_.affiliate-link]:underline [&_.affiliate-link]:decoration-dashed",
          // Callout styles inside the editor
          "[&_.callout]:p-4 [&_.callout]:rounded-lg [&_.callout]:border-l-4 [&_.callout]:my-4",
          "[&_.callout-tip]:bg-green-50 [&_.callout-tip]:border-green-500",
          "[&_.callout-warning]:bg-amber-50 [&_.callout-warning]:border-amber-500",
          "[&_.callout-info]:bg-blue-50 [&_.callout-info]:border-blue-500",
          "[&_.callout-note]:bg-gray-50 [&_.callout-note]:border-gray-400",
        ].join(" "),
      },
    },
  });

  const prevContent = useRef(content);
  useEffect(() => {
    if (editor && content !== prevContent.current) {
      editor.commands.setContent(content);
      prevContent.current = content;
    }
  }, [editor, content]);

  const wordCount = editor?.storage.characterCount?.words() ?? 0;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <EditorToolbar editor={editor} />
      {editor && <EditorBubbleMenus editor={editor} />}
      <EditorContent editor={editor} />
      <div className="px-6 py-2 border-t border-gray-100 text-xs text-gray-400 flex justify-end">
        {wordCount} words
      </div>
    </div>
  );
}
