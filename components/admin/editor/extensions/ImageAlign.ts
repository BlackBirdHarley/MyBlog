import Image from "@tiptap/extension-image";

export type ImageAlign = "left" | "center" | "right";
export type ImageSize  = "sm" | "md" | "lg" | "full";

export const ImageAlignExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "center" as ImageAlign,
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-align") ?? "center",
        renderHTML: (attrs) => ({ "data-align": attrs.align ?? "center" }),
      },
      size: {
        default: "full" as ImageSize,
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-size") ?? "full",
        renderHTML: (attrs) => ({ "data-size": attrs.size ?? "full" }),
      },
    };
  },
});
