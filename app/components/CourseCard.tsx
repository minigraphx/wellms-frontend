"use client";

import Link from "next/link";
import type { API } from "@escolalms/sdk/lib";
import type { MouseEvent } from "react";
import { ProgressBar } from "./ProgressBar";

interface CourseCardProps {
  course: API.CourseListItem;
  isEnrolled?: boolean;
  progressPct?: number;
}

export function CourseCard({ course, isEnrolled, progressPct }: CourseCardProps) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group block border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white"
    >
      {course.image_url ? (
        <img src={course.image_url} alt={course.title} className="w-full h-44 object-cover" />
      ) : (
        <div className="w-full h-44 bg-gray-50 flex items-center justify-center text-gray-300 text-sm">
          No image
        </div>
      )}
      <div className="p-5">
        <div className="flex gap-2 mb-2 flex-wrap">
          {isEnrolled && (
            <span
              data-testid="enrolled-badge"
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                progressPct === 100
                  ? "bg-[#04323e]/10 text-[#04323e]"
                  : "bg-[#f2c94c]/20 text-[#b8850a]"
              }`}
            >
              {progressPct === 100 ? "✓ Completed" : "In Progress"}
            </span>
          )}
          {course.level && (
            <span className="text-xs font-medium bg-[#1abc9c]/10 text-[#1abc9c] px-2 py-0.5 rounded-full">
              {course.level}
            </span>
          )}
          {course.topic_count != null && (
            <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {course.topic_count} lessons
            </span>
          )}
        </div>

        <h2 className="font-semibold text-[#04323e] group-hover:text-[#1abc9c] transition-colors">
          {course.title}
        </h2>

        {course.summary && (
          <p className="text-sm text-[#555555] mt-1 line-clamp-2">{course.summary}</p>
        )}

        {course.author && (
          <p className="text-xs text-gray-400 mt-3">
            <Link
              href={`/instructors/${course.author.id}`}
              onClick={(e: MouseEvent) => e.stopPropagation()}
              className="hover:text-[#1abc9c] transition-colors"
            >
              {course.author.first_name} {course.author.last_name}
            </Link>
          </p>
        )}

        {isEnrolled && progressPct !== undefined && (
          <div className="mt-3">
            <ProgressBar percent={progressPct} />
          </div>
        )}
      </div>
    </Link>
  );
}
