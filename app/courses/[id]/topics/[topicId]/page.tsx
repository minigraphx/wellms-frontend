"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { TopicType } from "@escolalms/sdk/lib/types/enums";
import { LessonNav } from "../../../../components/LessonNav";
import { TopicContent } from "../../../../components/TopicContent";
import { BookmarkButton } from "../../../../components/BookmarkButton";
import { ExplainDifferentlyButton } from "../../../../components/ExplainDifferentlyButton";
import { AiChatWidget } from "../../../../components/AiChatWidget";
import { useToast } from "../../../../components/Toast";
import { recordLessonCompletion } from "../../../../components/LearningGoalWidget";
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
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [summaryModal, setSummaryModal] = useState<{ text: string; nextPath: string } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const ctx = useContext(EscolaLMSContext);
  const {
    fetchProgram,
    program,
    fetchCourseProgress,
    courseProgressDetails,
    sendProgress,
    getNextPrevTopic,
    user,
    logout,
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

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const u = user.value;
  const initials = u
    ? `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() || u.email[0].toUpperCase()
    : "";

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
    recordLessonCompletion();

    const nextPath = nextTopic
      ? `/courses/${courseId}/topics/${nextTopic.id}`
      : `/courses/${courseId}/complete`;

    // For RichText topics: show AI key-takeaways summary before navigating
    if (topic?.topicable_type === TopicType.RichText) {
      const html = (topic as API.TopicRichText).topicable?.value ?? "";
      const plainText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000);
      if (plainText.length > 50) {
        setSummaryLoading(true);
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemPrompt:
                "Du bist ein hilfreicher Lernassistent. Fasse die wichtigsten 3-5 Punkte dieser Lektion als kurze Bullet-Points zusammen. Antworte auf Deutsch. Keine Einleitung, nur die Bullet-Points mit •.",
              messages: [{ role: "user", content: `Lektion: "${topic.title}"\n\n${plainText}` }],
            }),
          });
          const data = await res.json();
          if (data.content) {
            setSummaryLoading(false);
            setSummaryModal({ text: data.content, nextPath });
            return;
          }
        } catch {
          // Fall through to normal navigation on error
        }
        setSummaryLoading(false);
      }
    }

    if (nextTopic) {
      toast("Lesson complete! Moving to next topic.");
      router.push(nextPath);
    } else {
      toast("Course complete! 🎉", "success");
      router.push(nextPath);
    }
  }, [courseId, currentTopicId, nextTopic, topic, sendProgress, fetchCourseProgress, router, toast]);

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
        {/* Focus-mode header — minimal, no full site nav */}
        <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shrink-0">
          <nav className="text-sm text-gray-400 flex items-center min-w-0">
            <Link href={`/courses/${courseId}`} className="hover:text-[#1abc9c] transition-colors truncate max-w-[200px] sm:max-w-xs">
              ← {course.title}
            </Link>
            <span className="mx-2 shrink-0">›</span>
            <span className="text-[#04323e] truncate">{topic.title}</span>
          </nav>

          <div className="flex items-center gap-3 ml-4 shrink-0">
            {!isLocked && <BookmarkButton topicId={currentTopicId} />}

          {/* User menu in player header */}
          {u && (
            <div className="relative shrink-0 ml-4" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                aria-label="Open user menu"
                className="w-8 h-8 rounded-full bg-[#1abc9c]/10 text-[#1abc9c] text-sm font-bold flex items-center justify-center hover:bg-[#1abc9c]/20 transition-colors"
              >
                {(u as any)?.avatar ? (
                  <img src={(u as any).avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  initials
                )}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-40">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-xs font-semibold text-[#04323e] truncate">{u.first_name || u.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-2 text-sm text-[#555555] hover:bg-gray-50 hover:text-[#1abc9c] transition-colors"
                  >
                    My courses
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-2 text-sm text-[#555555] hover:bg-gray-50 hover:text-[#1abc9c] transition-colors"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => { logout(); setShowUserMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-[#555555] hover:bg-gray-50 hover:text-[#04323e] transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
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
              <>
                <TopicContent topic={topic} onVideoEnded={handleVideoEnded} />
                <ExplainDifferentlyButton topicTitle={topic.title} />
              </>
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
              disabled={isFinished || summaryLoading}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-colors ${
                isFinished
                  ? "bg-[#1abc9c]/10 text-[#1abc9c] cursor-default"
                  : "bg-[#1abc9c] hover:bg-[#15a288] text-white disabled:opacity-60"
              }`}
            >
              {summaryLoading
                ? "Zusammenfassung…"
                : isFinished
                ? "✓ Completed"
                : nextTopic
                ? "Mark Complete & Continue →"
                : "Mark as Complete"}
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

      {!isLocked && (
        <AiChatWidget
          courseTitle={course.title}
          topicTitle={topic.title}
        />
      )}

      {summaryModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h2 className="text-lg font-bold text-[#04323e]">Key Takeaways</h2>
            </div>
            <div className="text-sm text-[#555555] whitespace-pre-line leading-relaxed">
              {summaryModal.text}
            </div>
            <p className="text-xs text-gray-400">KI-generierte Zusammenfassung</p>
            <button
              onClick={() => {
                const path = summaryModal.nextPath;
                setSummaryModal(null);
                if (nextTopic) {
                  toast("Lesson complete! Moving to next topic.");
                } else {
                  toast("Course complete! 🎉", "success");
                }
                router.push(path);
              }}
              className="w-full bg-[#1abc9c] hover:bg-[#15a288] text-white font-semibold py-2.5 rounded-full transition-colors"
            >
              {nextTopic ? "Next lesson →" : "Finish course 🎉"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
