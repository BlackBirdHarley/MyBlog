// JSON-LD structured data builders

export interface SiteContext {
  siteName: string;
  siteUrl: string;
  twitterHandle?: string | null;
}

export function buildWebSiteJsonLd({ siteName, siteUrl, description }: SiteContext & { description?: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    ...(description ? { description } : {}),
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/blog?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBlogPostingJsonLd({
  title,
  description,
  url,
  imageUrl,
  datePublished,
  dateModified,
  authorName,
  site,
}: {
  title: string;
  description?: string | null;
  url: string;
  imageUrl?: string | null;
  datePublished?: Date | null;
  dateModified?: Date | null;
  authorName?: string | null;
  site: SiteContext;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    ...(description ? { description } : {}),
    url,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(datePublished ? { datePublished: datePublished.toISOString() } : {}),
    ...(dateModified ? { dateModified: dateModified.toISOString() } : {}),
    author: {
      "@type": "Person",
      name: authorName ?? site.siteName,
    },
    publisher: {
      "@type": "Organization",
      name: site.siteName,
      url: site.siteUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function jsonLdScript(data: object) {
  return JSON.stringify(data);
}
