"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import type { API } from "@escolalms/sdk/lib";
import { TopicContent } from "./TopicContent";
import { useT } from "../i18n/I18nProvider";

interface GuestTopicViewProps {
  courseId: number;
  topicId: number;
}

type PreviewState = { status: "idle" | "loading" | "error" } | { status: "loaded"; topic: API.Topic };

function findTopic(lessons: API.Lesson[] = [], topicId: number): API.Topic | undefined {
  for (const lesson of lessons) {
    const topic = lesson.topics?.find((t) => t.id === topicId) ?? findTopic(lesson.lessons, topicId);
    if (topic) return topic;
  }
  return undefined;
}

// Topic page for visitors who aren't signed in: free preview lessons come from the public
// preview endpoint (the program endpoint needs a login), everything else asks to sign in.
export function GuestTopicView({ courseId, topicId }: GuestTopicViewProps) {
  const { apiUrl, fetchCourse, course } = useContext(EscolaLMSContext);
  const [courseLoaded, setCourseLoaded] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });
  const t = useT();

  useEffect(() => {
    fetchCourse(courseId).finally(() => setCourseLoaded(true));
  }, [courseId, fetchCourse]);

  const courseData = course.value as API.Course | undefined;
  const topic = useMemo(() => findTopic(courseData?.lessons, topicId), [courseData, topicId]);

  useEffect(() => {
    if (!topic?.preview) return;
    let cancelled = false;
    setPreview({ status: "loading" });
    fetch(`${apiUrl}/api/courses/${courseId}/preview/${topicId}`, { headers: { Accept: "application/json" } })
      .then(async (res) => {
        const body = await res.json();
        if (cancelled) return;
        setPreview(res.ok && body?.success ? { status: "loaded", topic: body.data } : { status: "error" });
      })
      .catch(() => !cancelled && setPreview({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [apiUrl, courseId, topicId, topic?.preview]);

  if (!courseLoaded && !courseData) {
    return <div className="max-w-3xl mx-auto px-4 py-12 text-[#555555]">{t.common.loading}</div>;
  }

  if (!topic) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-[#555555] mb-4">{t.course.guest.lessonNotFound}</p>
        <Link href={`/courses/${courseId}`} className="text-[#1abc9c] hover:underline font-medium">{t.course.guest.backToCourse}</Link>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href={`/courses/${courseId}`} className="hover:text-[#1abc9c] transition-colors">{courseData?.title}</Link>
      </nav>
      <h1 className="text-2xl font-bold text-[#04323e] mb-6">{topic.title}</h1>

      {topic.preview ? (
        <>
          {preview.status === "loaded" && <TopicContent topic={preview.topic} />}
          {(preview.status === "loading" || preview.status === "idle") && <p className="text-[#555555]">{t.common.loading}</p>}
          {preview.status === "error" && <p className="text-red-600">{t.course.guest.previewError}</p>}
          <p className="mt-10 text-sm text-[#555555] border-t border-gray-100 pt-6">
            {t.course.guest.freePreview}{" "}
            <Link href="/" className="text-[#1abc9c] hover:underline font-medium">{t.course.signInLink}</Link> {t.course.guest.or}{" "}
            <Link href="/register" className="text-[#1abc9c] hover:underline font-medium">{t.course.guest.createAccountLink}</Link>{t.course.guest.toEnrollInCourse}
          </p>
        </>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-6 py-10 text-center">
          <p className="text-[#555555] mb-4">{t.course.guest.locked}</p>
          <div className="flex justify-center gap-3">
            <Link href="/" className="bg-[#1abc9c] hover:bg-[#15a288] text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-colors">{t.common.signIn}</Link>
            <Link href="/register" className="border border-[#1abc9c] text-[#1abc9c] hover:bg-[#1abc9c]/5 font-semibold px-6 py-2.5 rounded-full text-sm transition-colors">{t.common.createAccount}</Link>
          </div>
        </div>
      )}
    </main>
  );
}
