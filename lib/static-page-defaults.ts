export const STATIC_PAGE_DEFAULTS: Record<string, { title: string; content: object }> = {
  about: {
    title: "About",
    content: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Welcome to my blog!" }] },
      ],
    },
  },
  privacy: {
    title: "Privacy Policy",
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Last updated: " + new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) }],
        },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Information we collect" }] },
        {
          type: "paragraph",
          content: [{ type: "text", text: "This site collects anonymised page view and affiliate click data for internal analytics purposes. No personal data (name, email, cookies) is collected from visitors. IP addresses are cryptographically hashed with a daily-rotating salt and are never stored in raw form." }],
        },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Cookies" }] },
        {
          type: "paragraph",
          content: [{ type: "text", text: "This site does not use tracking cookies. A session cookie may be set if you are an authenticated admin." }],
        },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Third parties" }] },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Affiliate links may lead to third-party websites that have their own privacy policies." }],
        },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Contact" }] },
        {
          type: "paragraph",
          content: [{ type: "text", text: "If you have questions about this policy, please reach out via the contact information on the About page." }],
        },
      ],
    },
  },
  disclosure: {
    title: "Affiliate Disclosure",
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "This website contains affiliate links. When you click on these links and make a purchase, I may earn a small commission at no additional cost to you." }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "I only recommend products and services that I genuinely believe will add value to my readers. My opinions are always my own and are not influenced by affiliate relationships." }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Thank you for supporting this website by using my affiliate links. It helps me continue to create helpful content for you." }],
        },
      ],
    },
  },
};
