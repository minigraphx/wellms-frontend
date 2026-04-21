"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { Nav } from "../components/Nav";
import { ProgressBar } from "../components/ProgressBar";
import { LearningGoalWidget } from "../components/LearningGoalWidget";
import { LearningNudge } from "../components/LearningNudge";
import type { API } from "@escolalms/sdk/lib";

function getProgress(item: API.CourseProgressItem): number {
  const topics = item.progress ?? [];
  if (!topics.length) return 0;
  const done = topics.filter((t) => t.status === 1).length;
  return Math.round((done / topics.length) * 100);
}

function getResumeTopic(item: API.CourseProgressItem): number | null {
  const topics = item.progress ?? [];
  const incomplete = topics.find((t) => t.status !== 1);
  return incomplete?.topic_id ?? null;
}

export default function DashboardPage() {
  const { user, fetchProgress, progress } = useContext(EscolaLMSContext);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user.value) {
      router.push("/");
      return;
    }
    fetchProgress();
  }, [mounted, user.value]);

  if (!mounted) return null;

  if (!user.value) return null;

  const items: API.CourseProgressItem[] = progress.value ?? [];
  const inProgress = items.filter((i) => getProgress(i) < 100);
  const completed = items.filter((i) => getProgress(i) === 100);
  const sorted = [...inProgress, ...completed];

  return (
    <>
      <Nav />
      <LearningNudge />
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#04323e]">My courses</h1>
            <p className="text-[#555555] mt-1">Welcome back, {user.value.first_name || user.value.email}</p>
          </div>
          <div className="w-full sm:w-64 shrink-0">
            <LearningGoalWidget />
          </div>
        </div>

        {progress.loading && <p className="text-gray-500">Loading…</p>}

        {!progress.loading && sorted.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
            <Link
              href="/"
              className="inline-block bg-[#1abc9c] hover:bg-[#15a288] text-white font-semibold px-6 py-2.5 rounded-full transition-colors"
            >
              Browse courses
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((item) => {
            const course = item.course;
            if (!course) return null;
            const pct = getProgress(item);
            const isDone = pct === 100;
            const resumeTopicId = getResumeTopic(item);

            return (
              <div key={course.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                {course.image_url ? (
                  <img src={course.image_url} alt={course.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gray-50 flex items-center justify-center text-gray-300 text-sm">No image</div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="font-semibold text-[#04323e] mb-1 line-clamp-2">{course.title}</h2>
                  {(course as any).author && (
                    <p className="text-xs text-gray-400 mb-3">
                      {(course as any).author.first_name} {(course as any).author.last_name}
                    </p>
                  )}

                  <div className="mt-auto space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{isDone ? "Completed" : "In progress"}</span>
                        <span>{pct}%</span>
                      </div>
                      <ProgressBar percent={pct} />
                    </div>

                    {isDone ? (
                      <Link
                        href={`/courses/${course.id}/complete`}
                        className="block w-full text-center border border-[#1abc9c] text-[#1abc9c] hover:bg-[#1abc9c]/5 font-semibold py-2 rounded-full text-sm transition-colors"
                      >
                        View certificate
                      </Link>
                    ) : (
                      <Link
                        href={resumeTopicId ? `/courses/${course.id}/topics/${resumeTopicId}` : `/courses/${course.id}`}
                        className="block w-full text-center bg-[#1abc9c] hover:bg-[#15a288] text-white font-semibold py-2 rounded-full text-sm transition-colors"
                      >
                        {pct === 0 ? "Start" : "Continue"}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
