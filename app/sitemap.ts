import type { MetadataRoute } from "next";
import { fetchPublicCourses } from "./lib/publicApi";
import { SITE_URL, coursePath } from "./lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await fetchPublicCourses();
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    ...courses.map((course) => ({
      url: `${SITE_URL}${coursePath(course)}`,
      lastModified: course.updated_at ? new Date(course.updated_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
