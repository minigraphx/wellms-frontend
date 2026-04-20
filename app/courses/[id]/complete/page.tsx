"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import type { API } from "@escolalms/sdk/lib";

function flattenTopics(lessons: API.Lesson[]): API.Topic[] {
  const result: API.Topic[] = [];
  for (const lesson of lessons) {
    if (lesson.topics) result.push(...lesson.topics);
    if (lesson.lessons) result.push(...flattenTopics(lesson.lessons));
  }
  return result;
}

export default function CourseCompletePage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const router = useRouter();

  const {
    user,
    fetchProgram,
    program,
    fetchCourseProgress,
    courseProgressDetails,
    fetchCertificates,
    certificates,
    generateCertificate,
  } = useContext(EscolaLMSContext);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user.value) {
      router.push("/");
      return;
    }
    setLoading(true);
    Promise.all([
      fetchProgram(courseId),
      fetchCourseProgress(courseId),
      fetchCertificates({ assignable_id: courseId } as any),
    ]).finally(() => setLoading(false));
  }, [mounted, courseId, user.value]);

  const course = program.value;

  const allTopics = useMemo(
    () => (course?.lessons ? flattenTopics(course.lessons) : []),
    [course]
  );

  const topicProgressList: API.CourseProgressItemElement[] = useMemo(() => {
    const details = courseProgressDetails as any;
    return details?.byId?.[courseId]?.value ?? [];
  }, [courseProgressDetails, courseId]);

  const progressPct = useMemo(() => {
    if (!allTopics.length) return 0;
    const done = allTopics.filter((t) =>
      topicProgressList.some((p) => p.topic_id === t.id && p.status === 1)
    ).length;
    return Math.round((done / allTopics.length) * 100);
  }, [allTopics, topicProgressList]);

  // Redirect back if course isn't actually complete
  useEffect(() => {
    if (loading || !allTopics.length) return;
    if (progressPct < 100) {
      const firstIncomplete = allTopics.find(
        (t) => !topicProgressList.some((p) => p.topic_id === t.id && p.status === 1)
      );
      router.replace(
        firstIncomplete
          ? `/courses/${courseId}/topics/${firstIncomplete.id}`
          : `/courses/${courseId}`
      );
    }
  }, [loading, progressPct]);

  const cert: API.Certificate | null = useMemo(() => {
    const list = (certificates as any)?.list?.data ?? [];
    return list.find((c: API.Certificate) => c.assignable_id === courseId) ?? null;
  }, [certificates, courseId]);

  async function handleDownload() {
    if (!cert) return;
    setDownloadError("");
    setDownloading(true);
    try {
      const blob = await generateCertificate(cert.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${courseId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Could not generate certificate. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center space-y-6">

        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-[#1abc9c]/10 flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-[#1abc9c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-[#04323e]">Course complete!</h1>
          {course && (
            <p className="text-[#555555] mt-2 text-lg">{course.title}</p>
          )}
          <p className="text-gray-400 mt-1 text-sm">
            Great work — you've finished all {allTopics.length} lessons.
          </p>
        </div>

        {/* Certificate card */}
        {cert ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f2c94c]/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#f2c94c]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#04323e] text-sm">Certificate of completion</p>
                <p className="text-xs text-gray-400">{cert.title ?? course?.title}</p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white font-semibold py-3 rounded-full transition-colors"
            >
              {downloading ? "Generating…" : "Download certificate (PDF)"}
            </button>
            {downloadError && <p className="text-sm text-red-600">{downloadError}</p>}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No certificate is configured for this course.</p>
        )}

        {/* Nav links */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/dashboard"
            className="inline-block border border-[#1abc9c] text-[#1abc9c] hover:bg-[#1abc9c]/5 font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
          >
            My courses
          </Link>
          <Link
            href="/"
            className="inline-block border border-gray-200 text-[#555555] hover:border-gray-300 font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
          >
            Browse more courses
          </Link>
        </div>
      </div>
    </div>
  );
}
