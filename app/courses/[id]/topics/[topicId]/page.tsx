"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { LessonNav } from "../../../../components/LessonNav";
import { TopicContent } from "../../../../components/TopicContent";
import type { API } from "@escolalms/sdk/lib";

function flattenTopics(lessons: API.Lesson[]): API.Topic[] {
  const result: API.Topic[] = [];
  for (const lesson of lessons) {
    if (lesson.topics) result.push(...lesson.topics);
    if (lesson.lessons) result.push(...flattenTopics(lesson.lessons));
  }
  return result;
}

export default function TopicPage() {
  const { id, topicId } = useParams<{ id: string; topicId: string }>();
  const courseId = Number(id);
  const currentTopicId = Number(topicId);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const ctx = useContext(EscolaLMSContext);
  const {
    fetchProgram,
    program,
    fetchCourseProgress,
    courseProgressDetails,
    sendProgress,
    getNextPrevTopic,
    user,
    fetchMyCourses,
    myCourses,
  } = ctx;
  const topicPing = (ctx as unknown as { topicPing?: (id: number) => void }).topicPing;

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProgram(courseId), fetchCourseProgress(courseId), fetchMyCourses()]).finally(() =>
      setLoading(false)
    );
  }, [courseId]);

  const course = program.value;
  const allTopics = useMemo(() => (course?.lessons ? flattenTopics(course.lessons) : []), [course]);
  const topic = allTopics.find((t) => t.id === currentTopicId);

  const prevTopic = getNextPrevTopic(currentTopicId, false);
  const nextTopic = getNextPrevTopic(currentTopicId, true);

  const topicProgressList: API.CourseProgressItemElement[] = useMemo(() => {
    const details = courseProgressDetails as unknown as {
      byId?: Record<number, { value?: API.CourseProgressItemElement[] }>;
    };
    return details?.byId?.[courseId]?.value ?? [];
  }, [courseProgressDetails, courseId]);

  const isTopicFinished = useCallback(
    (tid: number) => topicProgressList.some((p) => p.topic_id === tid && p.status === 1),
    [topicProgressList]
  );

  const progressPct = useMemo(() => {
    if (!allTopics.length) return 0;
    const done = allTopics.filter((t) => isTopicFinished(t.id)).length;
    return Math.round((done / allTopics.length) * 100);
  }, [allTopics, isTopicFinished]);

  const isEnrolled = useMemo(() => {
    const val = (myCourses as unknown as { value?: unknown })?.value;
    if (!val) return false;
    if (Array.isArray((val as { ids?: number[] }).ids)) {
      return (val as { ids: number[] }).ids.includes(courseId);
    }
    if (Array.isArray(val)) {
      return (val as unknown[]).some((item) =>
        typeof item === "number" ? item === courseId : (item as { id?: number })?.id === courseId
      );
    }
    return false;
  }, [myCourses, courseId]);

  const isFinished = isTopicFinished(currentTopicId);
  const isLocked = !isEnrolled && !topic?.preview;

  // topicPing every 30s for time-on-topic analytics
  useEffect(() => {
    if (!topic || isLocked || !topicPing) return;
    topicPing(currentTopicId);
    const interval = setInterval(() => topicPing(currentTopicId), 30_000);
    return () => clearInterval(interval);
  }, [currentTopicId, isLocked, topic, topicPing]);

  const handleMarkComplete = useCallback(async () => {
    await sendProgress(courseId, [{ topic_id: currentTopicId, status: 1 }]);
    await fetchCourseProgress(courseId);
    if (nextTopic) {
      router.push(`/courses/${courseId}/topics/${nextTopic.id}`);
    }
  }, [courseId, currentTopicId, nextTopic, sendProgress, fetchCourseProgress, router]);

  const handleVideoEnded = useCallback(() => {
    if (!isFinished) handleMarkComplete();
  }, [isFinished, handleMarkComplete]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-gray-500">Course not found.</p>
        <Link href="/" className="text-[#1abc9c] hover:underline">
          Back to courses
        </Link>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-gray-500">Topic not found.</p>
        <Link href={`/courses/${courseId}`} className="text-[#1abc9c] hover:underline">
          Back to course
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <LessonNav
        program={course}
        courseId={courseId}
        activeTopicId={currentTopicId}
        isTopicFinished={isTopicFinished}
        isEnrolled={isEnrolled}
        progress={progressPct}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center px-6 py-3 bg-white border-b border-gray-100 shrink-0">
          <nav className="text-sm text-gray-400">
            <Link href="/" className="hover:text-[#1abc9c] transition-colors">
              Courses
            </Link>
            <span className="mx-2">›</span>
            <Link href={`/courses/${courseId}`} className="hover:text-[#1abc9c] transition-colors">
              {course.title}
            </Link>
            <span className="mx-2">›</span>
            <span className="text-[#04323e]">{topic.title}</span>
          </nav>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-10">
            <h1 className="text-2xl font-bold text-[#04323e] mb-6">{topic.title}</h1>

            {isLocked ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h2 className="text-xl font-bold text-[#04323e] mb-2">Enroll to unlock this lesson</h2>
                <p className="text-[#555555] mb-6">This content is only available to enrolled students.</p>
                <Link
                  href={`/courses/${courseId}`}
                  className="inline-block bg-[#1abc9c] hover:bg-[#15a288] text-white font-semibold px-8 py-3 rounded-full transition-colors"
                >
                  Go to course page
                </Link>
              </div>
            ) : (
              <TopicContent topic={topic} onVideoEnded={handleVideoEnded} />
            )}

            {topic.resources && topic.resources.length > 0 && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-[#04323e] mb-3">Resources</h3>
                <ul className="space-y-2">
                  {topic.resources.map((r) => (
                    <li key={r.id}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1abc9c] hover:underline text-sm"
                      >
                        {r.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <footer className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100 shrink-0">
          <div>
            {prevTopic ? (
              <Link
                href={`/courses/${courseId}/topics/${prevTopic.id}`}
                className="text-sm text-gray-400 hover:text-[#1abc9c] transition-colors"
              >
                ← {prevTopic.title}
              </Link>
            ) : (
              <Link
                href={`/courses/${courseId}`}
                className="text-sm text-gray-400 hover:text-[#1abc9c] transition-colors"
              >
                ← Back to course
              </Link>
            )}
          </div>

          {!isLocked && (
            <button
              onClick={handleMarkComplete}
              disabled={isFinished}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-colors ${
                isFinished
                  ? "bg-[#1abc9c]/10 text-[#1abc9c] cursor-default"
                  : "bg-[#1abc9c] hover:bg-[#15a288] text-white"
              }`}
            >
              {isFinished ? "✓ Completed" : nextTopic ? "Mark Complete & Continue →" : "Mark as Complete"}
            </button>
          )}

          <div>
            {nextTopic ? (
              <Link
                href={`/courses/${courseId}/topics/${nextTopic.id}`}
                className="text-sm text-gray-400 hover:text-[#1abc9c] transition-colors"
              >
                {nextTopic.title} →
              </Link>
            ) : (
              <Link
                href={`/courses/${courseId}`}
                className="text-sm text-gray-400 hover:text-[#1abc9c] transition-colors"
              >
                Finish course →
              </Link>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
