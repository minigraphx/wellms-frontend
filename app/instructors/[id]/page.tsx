"use client";

import { useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { Nav } from "../../components/Nav";
import { CourseCard } from "../../components/CourseCard";
import type { API } from "@escolalms/sdk/lib";

export default function InstructorPage() {
  const { id } = useParams<{ id: string }>();
  const tutorId = Number(id);
  const { fetchTutor, fetchCourses, myCourses, fetchMyCourses, user } = useContext(EscolaLMSContext);

  const [tutor, setTutor] = useState<API.UserItem | null>(null);
  const [courses, setCourses] = useState<API.CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchTutor(tutorId).then((res: any) => {
        setTutor(res?.data ?? null);
      }),
      fetchCourses({ author_id: tutorId } as any).then(() => {}),
    ]).finally(() => setLoading(false));
    if (user.value) fetchMyCourses();
  }, [tutorId]);

  // Pull courses from context after fetch
  const [contextCourses, setContextCourses] = useState<API.CourseListItem[]>([]);
  useEffect(() => {
    // fetchCourses updates the courses context; we grab them after
    fetchCourses({ author_id: tutorId } as any).then((res: any) => {
      setCourses(res?.data ?? []);
    });
  }, [tutorId]);

  const enrolledIds = new Set<number>((myCourses as any)?.value?.ids ?? []);
  const initials = tutor
    ? `${tutor.first_name?.[0] ?? ""}${tutor.last_name?.[0] ?? ""}`.toUpperCase() || "?"
    : "?";

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-12">
        {loading && <p className="text-gray-500">Loading…</p>}

        {!loading && !tutor && (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">Instructor not found.</p>
            <Link href="/" className="text-[#1abc9c] hover:underline">Browse courses</Link>
          </div>
        )}

        {tutor && (
          <>
            {/* Profile header */}
            <div className="flex items-start gap-6 mb-10">
              {tutor.avatar || tutor.url_avatar ? (
                <img
                  src={tutor.url_avatar ?? tutor.avatar}
                  alt={tutor.first_name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-100 shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#1abc9c]/10 text-[#1abc9c] flex items-center justify-center text-3xl font-bold shrink-0">
                  {initials}
                </div>
              )}

              <div>
                <h1 className="text-3xl font-bold text-[#04323e]">
                  {tutor.first_name} {tutor.last_name}
                </h1>
                {tutor.bio && (
                  <p className="text-[#555555] mt-3 leading-relaxed">{tutor.bio}</p>
                )}
                {tutor.categories && tutor.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tutor.categories.map((cat: any) => (
                      <span key={cat.id} className="text-xs font-medium bg-[#1abc9c]/10 text-[#1abc9c] px-3 py-1 rounded-full">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Courses by this instructor */}
            <h2 className="text-xl font-semibold text-[#04323e] mb-4">
              Courses by {tutor.first_name}
            </h2>

            {courses.length === 0 ? (
              <p className="text-gray-400">No courses published yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isEnrolled={enrolledIds.has(course.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
