import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_ORIGIN || "https://coaching-center.uz";

// Static, publicly indexable routes. Dynamic detail pages ([id]) are left
// out on purpose: they need the API to enumerate and would balloon the
// sitemap — add a dynamic generator later if individual content needs
// indexing.
const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/training", changeFrequency: "weekly", priority: 0.9 },
  { path: "/books", changeFrequency: "weekly", priority: 0.8 },
  { path: "/masterclass", changeFrequency: "weekly", priority: 0.9 },
  { path: "/plans", changeFrequency: "monthly", priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
