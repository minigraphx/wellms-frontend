import type { API } from "@escolalms/sdk/lib";

// Server-side reads of the public Wellms API (no login), for metadata, sitemap and the
// first render. Cached for a few minutes so crawlers don't hit the API on every request.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const REVALIDATE_SECONDS = 300;
const MAX_PAGES = 20;

async function getJson(path: string): Promise<{ success?: boolean; data?: unknown; meta?: { last_page?: number } } | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(`[publicApi] GET ${path} failed`, error);
    return null;
  }
}

// Published, public course with its curriculum; null for drafts and courses that need a login.
export async function fetchPublicCourse(id: number): Promise<API.Course | null> {
  const body = await getJson(`/api/courses/${id}`);
  return body?.success && body.data ? (body.data as API.Course) : null;
}

export async function fetchPublicCourses(): Promise<API.CourseListItem[]> {
  const courses: API.CourseListItem[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = await getJson(`/api/courses?per_page=100&page=${page}`);
    if (!body?.success || !Array.isArray(body.data)) break;
    courses.push(...(body.data as API.CourseListItem[]));
    if (page >= (body.meta?.last_page ?? 1)) break;
  }
  return courses;
}

// First catalogue page as the client requests it (GET /api/courses), for the initial HTML.
export async function fetchCatalogue(): Promise<API.CourseListItem[]> {
  const body = await getJson("/api/courses");
  return body?.success && Array.isArray(body.data) ? (body.data as API.CourseListItem[]) : [];
}
