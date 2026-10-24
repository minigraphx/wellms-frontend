import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CoursePageClient from "./CoursePageClient";
import { fetchPublicCourse } from "../../lib/publicApi";
import {
  SITE_URL,
  breadcrumbJsonLd,
  courseJsonLd,
  coursePath,
  courseSlug,
  jsonLdScript,
  metaDescription,
  parseCourseId,
} from "../../lib/seo";

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

async function loadCourse(param: string) {
  const courseId = parseCourseId(param);
  return { courseId, course: courseId ? await fetchPublicCourse(courseId) : null };
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { course } = await loadCourse((await params).id);
  // Drafts and login-only courses: members can still open them, search engines shouldn't.
  if (!course) return { robots: { index: false, follow: false } };

  const description = metaDescription(course.summary);
  const images = course.image_url ? [{ url: course.image_url }] : undefined;
  return {
    title: course.title,
    description,
    alternates: { canonical: coursePath(course) },
    openGraph: { type: "website", title: course.title, description, url: coursePath(course), images },
    twitter: { card: images ? "summary_large_image" : "summary", title: course.title, description },
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;
  const { courseId, course } = await loadCourse(id);
  if (!courseId) notFound();
  if (course && id !== courseSlug(course)) permanentRedirect(coursePath(course));

  const url = course ? `${SITE_URL}${coursePath(course)}` : "";
  return (
    <>
      {course && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript([
              courseJsonLd(course, url),
              breadcrumbJsonLd([
                { name: "Courses", url: `${SITE_URL}/` },
                { name: course.title, url },
              ]),
            ]),
          }}
        />
      )}
      <CoursePageClient courseId={courseId} initialCourse={course} />
    </>
  );
}
