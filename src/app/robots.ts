import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_ORIGIN || "https://coaching-center.uz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private / auth-gated areas shouldn't be crawled or indexed.
        disallow: [
          "/login",
          "/register",
          "/user",
          "/userupdate",
          "/me/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
