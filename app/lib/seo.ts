export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Wellms";

interface SeoCourse {
  id: number;
  title: string;
  summary?: string | null;
  language?: string | null;
  image_url?: string | null;
}

const UMLAUTS: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };

// "/courses/2-chatgpt-co-einstiegskurs-ki": the id keeps the URL stable when the title changes.
export function courseSlug({ id, title }: Pick<SeoCourse, "id" | "title">): string {
  const words = title
    .toLowerCase()
    .replace(/[äöüß]/g, (ch) => UMLAUTS[ch])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return words ? `${id}-${words}` : String(id);
}

export const coursePath = (course: Pick<SeoCourse, "id" | "title">) => `/courses/${courseSlug(course)}`;

export function parseCourseId(param: string): number | null {
  const match = /^(\d+)(?:-|$)/.exec(param);
  const id = match ? Number(match[1]) : 0;
  return id > 0 ? id : null;
}

// Plain text from Markdown/HTML, cut at a word boundary to fit meta descriptions.
export function metaDescription(text: string | null | undefined, max = 160): string {
  if (!text) return "";
  const plain = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`>|~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function courseJsonLd(course: SeoCourse, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: metaDescription(course.summary, 500) || course.title,
    inLanguage: course.language ?? "de",
    url,
    ...(course.image_url ? { image: course.image_url } : {}),
    provider: { "@type": "Organization", name: SITE_NAME, sameAs: SITE_URL },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// JSON.stringify doesn't escape "<", so course text could close the <script> tag.
export const jsonLdScript = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

// For pages that aren't landing pages (player, dashboard, checkout, ...).
export const NOINDEX = { robots: { index: false, follow: false } } as const;
