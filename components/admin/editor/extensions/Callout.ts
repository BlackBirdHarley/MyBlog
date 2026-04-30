import { Node, mergeAttributes } from "@tiptap/core";

export type CalloutType = "tip" | "warning" | "info" | "note";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      insertCallout: (type: CalloutType) => ReturnType;
    };
  }
}

export const CalloutExtension = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      type: { default: "tip" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]", getAttrs: (el) => ({ type: (el as HTMLElement).dataset.callout }) }];
  },

  renderHTML({ HTMLAttributes }) {
    const type: CalloutType = HTMLAttributes.type ?? "tip";
    return [
      "div",
      mergeAttributes({ "data-callout": type, class: `callout callout-${type}` }),
      0,
    ];
  },

  addCommands() {
    return {
      insertCallout:
        (type: CalloutType) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { type },
            content: [{ type: "paragraph" }],
          });
        },
    };
  },
});
