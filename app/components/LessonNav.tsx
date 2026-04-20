"use client";

import { useState } from "react";
import Link from "next/link";
import type { API } from "@escolalms/sdk/lib";

function TopicLink({
  topic,
  courseId,
  activeTopicId,
  isFinished,
  isEnrolled,
}: {
  topic: API.Topic;
  courseId: number;
  activeTopicId: number;
  isFinished: boolean;
  isEnrolled: boolean;
}) {
  const isActive = topic.id === activeTopicId;
  const locked = !isEnrolled && !topic.preview;

  if (locked) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 cursor-default select-none">
        <span className="shrink-0 text-xs">🔒</span>
        <span className="line-clamp-2">{topic.title}</span>
      </div>
    );
  }

  return (
    <Link
      href={`/courses/${courseId}/topics/${topic.id}`}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-[#1abc9c] text-white font-medium"
          : "text-[#555555] hover:bg-[#1abc9c]/10 hover:text-[#1abc9c]"
      }`}
    >
      <span className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-xs ${
        isFinished
          ? "bg-[#1abc9c] border-[#1abc9c] text-white"
          : isActive
          ? "border-white"
          : "border-gray-300"
      }`}>
        {isFinished ? "✓" : ""}
      </span>
      <span className="line-clamp-2">{topic.title}</span>
    </Link>
  );
}

function isDripLocked(lesson: API.Lesson): boolean {
  if (!lesson.active_from) return false;
  return new Date(lesson.active_from) > new Date();
}

function formatUnlockDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function LessonGroup({
  lesson,
  courseId,
  activeTopicId,
  isTopicFinished,
  isEnrolled,
  depth = 0,
}: {
  lesson: API.Lesson;
  courseId: number;
  activeTopicId: number;
  isTopicFinished: (id: number) => boolean;
  isEnrolled: boolean;
  depth?: number;
}) {
  const containsActive =
    lesson.topics?.some((t) => t.id === activeTopicId) ||
    lesson.lessons?.some((l) => l.topics?.some((t) => t.id === activeTopicId));
  const [open, setOpen] = useState(containsActive ?? depth === 0);
  const drip = isEnrolled && isDripLocked(lesson);

  if (drip) {
    return (
      <div className={`${depth > 0 ? "ml-3 border-l border-gray-100 pl-2" : ""} opacity-60`}>
        <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
          <span>🕐</span>
          <span>{lesson.title}</span>
        </div>
        <p className="px-2 pb-2 text-xs text-gray-400">
          Unlocks {formatUnlockDate(lesson.active_from!)}
        </p>
      </div>
    );
  }

  return (
    <div className={depth > 0 ? "ml-3 border-l border-gray-100 pl-2" : ""}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-[#04323e] transition-colors text-left"
      >
        <span>{lesson.title}</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-0.5">
          {lesson.topics?.map((topic) => (
            <TopicLink
              key={topic.id}
              topic={topic}
              courseId={courseId}
              activeTopicId={activeTopicId}
              isFinished={isTopicFinished(topic.id)}
              isEnrolled={isEnrolled}
            />
          ))}
          {lesson.lessons?.map((sub) => (
            <LessonGroup
              key={sub.id}
              lesson={sub}
              courseId={courseId}
              activeTopicId={activeTopicId}
              isTopicFinished={isTopicFinished}
              isEnrolled={isEnrolled}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LessonNav({
  program,
  courseId,
  activeTopicId,
  isTopicFinished,
  isEnrolled,
  progress,
}: {
  program: API.CourseProgram;
  courseId: number;
  activeTopicId: number;
  isTopicFinished: (id: number) => boolean;
  isEnrolled: boolean;
  progress: number;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`flex flex-col bg-white border-r border-gray-100 h-screen sticky top-0 transition-all duration-200 ${collapsed ? "w-12" : "w-72"}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
        {!collapsed && (
          <Link href={`/courses/${courseId}`} className="font-semibold text-sm text-[#04323e] line-clamp-2 hover:text-[#1abc9c] transition-colors">
            {program.title}
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 shrink-0 ml-auto"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Progress</span>
              <span className="text-[#1abc9c] font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1abc9c] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {program.lessons.map((lesson) => (
              <LessonGroup
                key={lesson.id}
                lesson={lesson}
                courseId={courseId}
                activeTopicId={activeTopicId}
                isTopicFinished={isTopicFinished}
                isEnrolled={isEnrolled}
              />
            ))}
          </nav>
        </>
      )}
    </aside>
  );
}
