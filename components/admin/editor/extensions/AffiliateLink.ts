import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    affiliateLink: {
      setAffiliateLink: (attrs: { linkId: string; displayLabel?: string }) => ReturnType;
      unsetAffiliateLink: () => ReturnType;
    };
  }
}

export const AffiliateLinkExtension = Mark.create({
  name: "affiliateLink",

  priority: 1001, // higher than built-in Link

  keepOnSplit: false,

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
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-affiliate-id": HTMLAttributes.linkId,
        class: "affiliate-link",
        // href shown in editor only — public side uses /go/
        href: `#affiliate-${HTMLAttributes.linkId}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setAffiliateLink:
        (attrs) =>
        ({ commands }) =>
          commands.setMark(this.name, attrs),
      unsetAffiliateLink:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
