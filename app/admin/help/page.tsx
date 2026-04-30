import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HelpPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900">Help & Guide</h1>
        <p className="text-gray-500 mt-1">Full instructions for managing your blog.</p>
      </div>

      <div className="space-y-12">

        {/* ── 1. Initial Setup ── */}
        <Section id="setup" title="1. Initial Setup">
          <H3>Fill in .env</H3>
          <Code>{`# Neon PostgreSQL — two URLs from Neon console (Settings → Connection string)
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# Session secret — generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret"

# Your site URL (in production — your domain)
SITE_URL="https://yourblog.com"

# Salt for IP hashing in analytics
ANALYTICS_SALT="any-random-string"

# Admin account credentials
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="strong-password"`}</Code>

          <H3>Apply schema and create admin account</H3>
          <Code>{`npx prisma migrate deploy   # apply all migrations
npx prisma generate         # regenerate client
npx tsx prisma/seed.ts      # create admin user from .env`}</Code>

          <H3>Site Settings — /admin/settings</H3>
          <Table
            headers={["Field", "What to enter"]}
            rows={[
              ["Site name", "Blog name — shown in header and <title> tag"],
              ["Tagline", "Subtitle — e.g. \"Best home organization ideas\""],
              ["Site description", "Meta description for the homepage"],
              ["Site URL", "Full URL with https — required for JSON-LD and canonical"],
              ["Twitter handle", "@yourhandle — pulled into Twitter Cards"],
              ["Default disclosure", "Affiliate disclosure text shown on every article"],
              ["Footer text", "Footer text, or leave blank to auto-generate"],
              ["Pinterest user ID", "Your Pinterest username — \"via @you\" when saving a pin"],
            ]}
          />
        </Section>

        {/* ── 2. Categories & Tags ── */}
        <Section id="categories" title="2. Categories & Tags">
          <p className="text-gray-600 text-sm leading-relaxed">
            Create categories first — they are needed for proper URL structure and SEO.
          </p>
          <p className="mt-3 text-gray-600 text-sm leading-relaxed">
            <strong>/admin/categories</strong> → «New category»: fill in Name, Slug (auto-generated), and optionally Description (shown on the category page).
          </p>
          <p className="mt-3 text-gray-600 text-sm leading-relaxed">
            <strong>/admin/tags</strong> — same process. Tags are more specific: «small-kitchen», «budget», «ikea-hacks». Use 3–7 tags per article.
          </p>
        </Section>

        {/* ── 3. Affiliate Links ── */}
        <Section id="links" title="3. Affiliate Links">
          <Callout type="tip">Create all links first, then insert them into articles — not the other way around.</Callout>

          <H3>Create a link — /admin/links/new</H3>
          <Table
            headers={["Field", "Example"]}
            rows={[
              ["Internal name", "Amazon — Stackable Bins Set"],
              ["Destination URL", "https://amazon.com/dp/B09XYZ?tag=yourtag-20"],
              ["Default anchor text", "Check Price on Amazon — auto-fills in the editor"],
              ["Affiliate program", "Amazon Associates"],
              ["Category", "Kitchen"],
              ["Commission rate", "3.5 (%) — for your own ROI tracking only"],
              ["Active", "✅ enabled"],
            ]}
          />

          <H3>Insert a link into an article</H3>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            In the article editor — click the <strong>affiliate link button</strong> ($ icon) in the toolbar:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600">
            <li>Select the text that will become the link, or place the cursor where needed</li>
            <li>Click the affiliate link button → a search box appears</li>
            <li>Search by link name, click to select — the text wraps in a link</li>
          </ol>
          <Callout type="info">
            Links are stored by ID in content, without the real URL. On the public page they render as /go/[id]?article=[id] with rel=&quot;nofollow sponsored&quot; — correct for SEO and FTC compliance.
          </Callout>

          <H3>Managing links</H3>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-600">
            <li><strong>/admin/links</strong> — all links, status (active/inactive), click counts</li>
            <li><strong>/admin/links/[id]</strong> — click trend chart for 7/30/90 days, which articles use the link</li>
            <li><strong>Inactive link</strong> — renders as plain text in articles, no redirect</li>
          </ul>
        </Section>

        {/* ── 4. Articles ── */}
        <Section id="articles" title="4. Articles">
          <H3>Create an article — /admin/articles/new</H3>
          <Table
            headers={["Field", "Notes"]}
            rows={[
              ["Title", "Article headline"],
              ["Slug", "URL path — auto-generated from title, can be changed"],
              ["Excerpt", "1–2 sentences — used in cards and meta description"],
              ["Layout variant", "Choose article type (see Section 5)"],
              ["Category", "Required for SEO and navigation"],
              ["Tags", "3–7 tags"],
              ["Meta title", "If different from title (up to 60 characters)"],
              ["Meta description", "Up to 155 characters, if different from excerpt"],
              ["Canonical URL", "Only if republishing content from another site"],
              ["Pin description", "Pinterest pin text — falls back to excerpt if empty"],
            ]}
          />

          <H3>Toolbar reference</H3>
          <Table
            headers={["Button", "Action"]}
            rows={[
              ["B / I / S", "Bold, Italic, Strikethrough"],
              ["H2 / H3", "Section headings"],
              ["List / Numbered", "Bullet and ordered lists"],
              ["\" \"", "Blockquote — styled as verdict box in Comparison layout"],
              ["—", "Horizontal rule"],
              ["🔗", "Regular external link"],
              ["💲", "Affiliate link (AffiliateLinkPicker)"],
              ["🖼", "Insert image by URL"],
              ["Table", "Insert a table"],
              ["⚠️▾", "Callout block — tip / warning / info / note"],
            ]}
          />

          <H3>Publishing statuses</H3>
          <Table
            headers={["Status", "Behavior"]}
            rows={[
              ["Draft", "Not visible on the site"],
              ["Published", "Immediately public, publishedAt set to now"],
              ["Scheduled", "Set a future date — goes live on next page request after that time"],
              ["Archived", "Hidden from site, data preserved"],
            ]}
          />

          <H3>Images</H3>
          <Table
            headers={["Type", "Size", "Ratio"]}
            rows={[
              ["Hero (horizontal)", "1200×630px", "16:9"],
              ["Pinterest", "1000×1500px", "2:3"],
              ["Inline in article", "up to 1200px wide", "any"],
            ]}
          />
          <Callout type="tip">
            Upload a vertical Pinterest image (2:3) separately in the «Pinterest image» field — it is used for pins. The horizontal hero is used for OG/Twitter and the article header.
          </Callout>
        </Section>

        {/* ── 5. Layout variants ── */}
        <Section id="layouts" title="5. Layout Variants">
          <Table
            headers={["Layout", "Best for", "Special behavior"]}
            rows={[
              ["Classic Blog", "Regular article, review", "Standard width, hero, prose"],
              ["Listicle / Roundup", "«10 Best X for Y»", "H2 headings auto-numbered (1, 2, 3…) + «N picks» badge"],
              ["Ultimate Guide", "Long-form guide 2000+ words", "Sticky TOC sidebar on desktop, collapsible on mobile, wide hero"],
              ["Visual Gallery", "Photo roundups, product showcases", "Full-width hero with overlay, enlarged inline images"],
              ["Comparison / Review", "Product comparisons", "Quick-jump by H2 sections, blockquote = verdict box, rose accents"],
            ]}
          />
          <Callout type="tip">
            Listicle tip: start the title with a number — «12 Best Storage Bins…» — the «N picks» badge picks it up automatically.
          </Callout>
          <Callout type="tip">
            Ultimate Guide tip: use H2 for main sections — they appear in the TOC. Need at least 3 H2 headings for the TOC to show.
          </Callout>
        </Section>

        {/* ── 6. Callout blocks ── */}
        <Section id="callouts" title="6. Callout Blocks">
          <p className="text-sm text-gray-600 mb-4">
            In the toolbar — the warning icon button (⚠️▾). Choose a type:
          </p>
          <Table
            headers={["Type", "Color", "When to use"]}
            rows={[
              ["✅ Tip", "Green", "Useful advice, life hack"],
              ["⚠️ Warning", "Yellow", "Caution, «don't do this»"],
              ["ℹ️ Info", "Blue", "Reference information, clarification"],
              ["📝 Note", "Gray", "Side note, addendum"],
            ]}
          />
        </Section>

        {/* ── 7. Analytics ── */}
        <Section id="analytics" title="7. Analytics">
          <H3>Dashboard — /admin</H3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Quick overview: page views and clicks for 30 days with delta vs. the previous period, a mini chart, and top 5 articles and links.
          </p>

          <H3>Full analytics — /admin/analytics</H3>
          <p className="text-sm text-gray-600 mb-3">Period switcher: <strong>7d / 30d / 90d</strong></p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-600">
            <li><strong>Page views over time</strong> — daily line chart</li>
            <li><strong>Top articles</strong> — links to per-article analytics pages</li>
            <li><strong>Top affiliate links</strong> — links to per-link pages</li>
            <li><strong>Device breakdown</strong> — mobile / tablet / desktop (pie chart)</li>
            <li><strong>Browser breakdown</strong> — Chrome / Firefox / Safari / Edge</li>
            <li><strong>Top referrers</strong> — where traffic comes from (Pinterest, Google, Direct…)</li>
          </ul>

          <H3>Article analytics — /admin/articles/[id]/analytics</H3>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-600">
            <li>Views, Clicks, CTR for the selected period</li>
            <li>All-time views — total since publication</li>
            <li>Views over time — daily chart</li>
            <li>Affiliate link clicks table — which link brought how many clicks from this article + share of total</li>
          </ul>

          <H3>Link analytics — /admin/links/[id]</H3>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-600">
            <li>All-time clicks and clicks for the selected period</li>
            <li>Clicks over time — trend chart</li>
            <li>Which articles use this link and how many clicks each brought</li>
          </ul>

          <Callout type="info">
            Analytics are cookieless — no cookies, no GDPR banner needed. IP is hashed daily, bots are filtered automatically. One user on one page within 30 minutes = 1 view.
          </Callout>
        </Section>

        {/* ── 8. Pinterest Workflow ── */}
        <Section id="pinterest" title="8. Pinterest Workflow">
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Write and publish the article</li>
            <li>Upload a <strong>vertical image (2:3)</strong> in the «Pinterest image» field</li>
            <li>Fill in <strong>Pin description</strong> — falls back to excerpt if empty</li>
            <li>Open the article on the site — find the red <strong>«Save»</strong> button near the title</li>
            <li>Click «Save» → Pinterest opens with a ready pin: image + description + article link</li>
            <li>Publish the pin to the right board</li>
          </ol>
          <Callout type="tip">
            One pin = one article. Create multiple image variants for the same article and pin them on different days to different boards to maximize reach.
          </Callout>
        </Section>

        {/* ── 9. Daily Workflow ── */}
        <Section id="workflow" title="9. Daily Workflow">
          <Code>{`1. /admin/analytics          → check what's working
2. /admin/links/new          → add new affiliate links
3. /admin/articles/new       → write an article
4. Publish the article       → open on site, click «Save» for Pinterest
5. Once a week               → /admin/analytics?days=7 → what drove clicks this week`}</Code>
        </Section>

      </div>
    </div>
  );
}

/* ── Local components ── */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-5 pb-2 border-b border-gray-100">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-gray-800 mt-5 mb-2">{children}</h3>;
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-gray-950 text-gray-100 text-xs rounded-xl px-5 py-4 overflow-x-auto leading-relaxed whitespace-pre">
      {children}
    </pre>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {headers.map((h) => (
              <th key={h} className="text-left font-medium text-gray-500 px-4 py-2.5 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-2.5 text-gray-600 ${j === 0 ? "font-medium text-gray-800 whitespace-nowrap" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ type, children }: { type: "tip" | "info" | "warning" | "note"; children: React.ReactNode }) {
  const styles = {
    tip:     { bg: "bg-green-50",  border: "border-green-400", label: "✅ Tip",     text: "text-green-800" },
    info:    { bg: "bg-blue-50",   border: "border-blue-400",  label: "ℹ️ Info",    text: "text-blue-800"  },
    warning: { bg: "bg-amber-50",  border: "border-amber-400", label: "⚠️ Warning", text: "text-amber-800" },
    note:    { bg: "bg-gray-50",   border: "border-gray-400",  label: "📝 Note",    text: "text-gray-700"  },
  }[type];

  return (
    <div className={`${styles.bg} border-l-4 ${styles.border} rounded-r-xl px-4 py-3 text-sm ${styles.text}`}>
      <span className="font-semibold">{styles.label} — </span>
      {children}
    </div>
  );
}
