import { Extension, type CommandProps } from "@tiptap/core";

export type LineHeightValue = "1.35" | "1.55" | "1.75";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: LineHeightValue) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

const TARGET_NODE_TYPES = new Set(["paragraph", "heading", "listItem", "blockquote"]);

export const LineHeightExtension = Extension.create({
  name: "lineHeight",

  addGlobalAttributes() {
    return [
      {
        types: Array.from(TARGET_NODE_TYPES),
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => {
              const value = (element as HTMLElement).style.lineHeight;
              return value || null;
            },
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {};
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    const updateSelectedBlocks =
      (lineHeight: LineHeightValue | null) =>
      ({ state, dispatch }: CommandProps) => {
        const { tr, selection } = state;
        const { from, to } = selection;

        if (selection.empty) {
          for (let depth = selection.$from.depth; depth > 0; depth--) {
            const node = selection.$from.node(depth);
            if (!TARGET_NODE_TYPES.has(node.type.name)) continue;
            tr.setNodeMarkup(selection.$from.before(depth), undefined, {
              ...node.attrs,
              lineHeight,
            });
            break;
          }
        } else {
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!TARGET_NODE_TYPES.has(node.type.name)) return;
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              lineHeight,
            });
          });
        }

        if (!tr.docChanged) return false;
        dispatch?.(tr);
        return true;
      };

    return {
      setLineHeight: (lineHeight) => updateSelectedBlocks(lineHeight),
      unsetLineHeight: () => updateSelectedBlocks(null),
    };
  },
});
