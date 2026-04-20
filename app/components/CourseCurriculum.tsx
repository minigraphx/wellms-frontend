"use client";

import { useState } from "react";
import Link from "next/link";
import type { API } from "@escolalms/sdk/lib";

function TopicRow({
  topic,
  courseId,
  isEnrolled,
}: {
  topic: API.Topic;
  courseId: number;
  isEnrolled: boolean;
}) {
  const locked = !isEnrolled && !topic.preview;

  if (locked) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 rounded cursor-default select-none">
        <span>🔒</span>
        <span>{topic.title}</span>
        {topic.duration && <span className="ml-auto text-xs text-gray-300">{topic.duration}</span>}
      </div>
    );
  }

  return (
    <Link
      href={`/courses/${courseId}/topics/${topic.id}`}
      className="flex items-center gap-3 px-4 py-2 text-sm text-[#555555] hover:bg-[#1abc9c]/5 hover:text-[#1abc9c] rounded transition-colors"
    >
      <span className="text-gray-300">○</span>
      <span>{topic.title}</span>
      {topic.duration && <span className="ml-auto text-xs text-gray-400">{topic.duration}</span>}
    </Link>
  );
}

function LessonSection({
  lesson,
  courseId,
  isEnrolled,
  depth = 0,
}: {
  lesson: API.Lesson;
  courseId: number;
  isEnrolled: boolean;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth === 0);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="font-semibold text-[#04323e]">{lesson.title}</span>
        <span className="text-gray-400 text-xs ml-4 shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="py-2">
          {lesson.topics?.map((topic) => (
            <TopicRow key={topic.id} topic={topic} courseId={courseId} isEnrolled={isEnrolled} />
          ))}
          {lesson.lessons?.map((sub) => (
            <div key={sub.id} className="ml-4 mt-1">
              <LessonSection lesson={sub} courseId={courseId} isEnrolled={isEnrolled} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CourseCurriculum({
  lessons,
  courseId,
  isEnrolled,
}: {
  lessons: API.Lesson[];
  courseId: number;
  isEnrolled: boolean;
}) {
  return (
    <div>
      {lessons.map((lesson) => (
        <LessonSection key={lesson.id} lesson={lesson} courseId={courseId} isEnrolled={isEnrolled} />
      ))}
    </div>
  );
}
