"use client";

import Link from "next/link";
import type { API } from "@escolalms/sdk/lib";
import { ProgressBar } from "./ProgressBar";
import { coursePath } from "../lib/seo";
import { useT } from "../i18n/I18nProvider";

interface CourseCardProps {
  course: API.CourseListItem;
  isEnrolled?: boolean;
  progressPct?: number;
}

export function CourseCard({ course, isEnrolled, progressPct }: CourseCardProps) {
  const t = useT();
  return (
    // The title link stretches over the whole card (after:inset-0), so the author link can sit
    // on top of it instead of being nested inside another link.
    <article className="group relative border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white">
      {course.image_url ? (
        <img src={course.image_url} alt={course.title} className="w-full h-44 object-cover" />
      ) : (
        <div className="w-full h-44 bg-gray-50 flex items-center justify-center text-gray-300 text-sm">
          {t.catalog.noImage}
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
              {progressPct === 100 ? `✓ ${t.catalog.completed}` : t.catalog.inProgress}
            </span>
          )}
          {course.level && (
            <span className="text-xs font-medium bg-[#1abc9c]/10 text-[#1abc9c] px-2 py-0.5 rounded-full">
              {course.level}
            </span>
          )}
          {course.topic_count != null && (
            <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {t.common.lessonCount(course.topic_count)}
            </span>
          )}
        </div>

        <h2 className="font-semibold text-[#04323e] group-hover:text-[#1abc9c] transition-colors">
          <Link href={coursePath(course)} className="after:absolute after:inset-0">
            {course.title}
          </Link>
        </h2>

        {course.summary && (
          <p className="text-sm text-[#555555] mt-1 line-clamp-2">{course.summary}</p>
        )}

        {course.author && (
          <p className="text-xs text-gray-400 mt-3">
            <Link
              href={`/instructors/${course.author.id}`}
              className="relative z-10 hover:text-[#1abc9c] transition-colors"
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
    </article>
  );
}
