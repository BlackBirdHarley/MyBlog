import "server-only";
import { generateHTML } from "@tiptap/html/server";
import { Mark, Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { ImageAlignExtension } from "@/components/admin/editor/extensions/ImageAlign";

// Server-side callout renderer — mirrors the editor extension
const CalloutRenderer = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  addAttributes() {
    return { type: { default: "tip" } };
  },
  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const type = HTMLAttributes.type ?? "tip";
    return ["div", mergeAttributes({ "data-callout": type, class: `callout callout-${type}` }), 0];
  },
});

// Server-side affiliate link extension — renders as /go/[linkId] with proper rel attributes
function makeAffiliateLinkRenderer(articleId?: string) {
  return Mark.create({
    name: "affiliateLink",
    addAttributes() {
      return {
        linkId: { default: null },
        displayLabel: { default: null },
      };
    },
    parseHTML() {
      return [{ tag: "a[data-affiliate-id]" }];
    },
    renderHTML({ HTMLAttributes }) {
      const { linkId } = HTMLAttributes;
      if (!linkId) return ["span", {}, 0];
      const href = articleId
        ? `/go/${linkId}?article=${articleId}`
        : `/go/${linkId}`;
      return [
        "a",
        mergeAttributes({
          href,
          rel: "nofollow sponsored",
          target: "_blank",
          "data-affiliate-id": linkId,
          class: "affiliate-link",
        }),
        0,
      ];
    },
  });
}

function buildExtensions(articleId?: string) {
  return [
    StarterKit.configure({ link: { HTMLAttributes: { rel: "nofollow noopener", target: "_blank" } } }),
    ImageAlignExtension,
    Table,
    TableRow,
    TableCell,
    TableHeader,
    makeAffiliateLinkRenderer(articleId),
    CalloutRenderer,
  ];
}

export function renderContent(json: object, articleId?: string): string {
  try {
    return generateHTML(
      json as Parameters<typeof generateHTML>[0],
      buildExtensions(articleId)
    );
  } catch {
    return "";
  }
}

export function extractText(json: object): string {
  try {
    return renderContent(json).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

function headingTextToId(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 60);
}

export function extractHeadings(json: object): Array<{ id: string; level: number; text: string }> {
  const html = renderContent(json);
  const headings: Array<{ id: string; level: number; text: string }> = [];
  const matches = html.matchAll(/<h([23])[^>]*>(.*?)<\/h[23]>/gi);
  for (const match of matches) {
    const text = match[2].replace(/<[^>]+>/g, "");
    headings.push({ id: headingTextToId(text), level: parseInt(match[1]), text });
  }
  return headings;
}

// Injects id="" attributes onto h2/h3 elements so TOC anchor links work
export function addHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (_match, level, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, "");
    const id = headingTextToId(text);
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
}

// Extract all affiliate link IDs from TipTap JSON (for ArticleLink sync)
export function extractAffiliateLinkIds(json: object): string[] {
  const ids = new Set<string>();

  function walk(node: Record<string, unknown>) {
    if (node.marks && Array.isArray(node.marks)) {
      for (const mark of node.marks as Record<string, unknown>[]) {
        if (mark.type === "affiliateLink") {
          const attrs = mark.attrs as Record<string, unknown> | undefined;
          if (attrs?.linkId && typeof attrs.linkId === "string") {
            ids.add(attrs.linkId);
          }
        }
      }
    }
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content as Record<string, unknown>[]) {
        walk(child);
      }
    }
  }

  walk(json as Record<string, unknown>);
  return Array.from(ids);
}
