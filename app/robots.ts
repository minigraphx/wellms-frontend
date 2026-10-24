import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/seo";

// Personal and in-course pages aren't landing pages; they also set noindex in their layouts.
const PRIVATE_PATHS = [
  "/dashboard",
  "/checkout",
  "/orders",
  "/profile",
  "/bookmarks",
  "/flashcards",
  "/tutor",
  "/reset-password",
  "/courses/*/topics/",
  "/courses/*/complete",
  "/api/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
