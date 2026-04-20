"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { CourseCurriculum } from "../../components/CourseCurriculum";
import { useToast } from "../../components/Toast";
import type { API } from "@escolalms/sdk/lib";

function flattenTopics(lessons: API.Lesson[]): API.Topic[] {
  const result: API.Topic[] = [];
  for (const lesson of lessons) {
    if (lesson.topics) result.push(...lesson.topics);
    if (lesson.lessons) result.push(...flattenTopics(lesson.lessons));
  }
  return result;
}

export default function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const {
    fetchProgram,
    program,
    user,
    fetchCourseProgress,
    courseProgressDetails,
    addCourseAccess,
    fetchMyCourses,
    myCourses,
    fetchMyProducts,
  } = useContext(EscolaLMSContext);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [accessExpiry, setAccessExpiry] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Wait until we know auth state before fetching (program endpoint requires auth)
    if (!mounted) return;
    if (!user.value) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProgram(courseId).finally(() => setLoading(false));
  }, [mounted, courseId, user.value]);

  useEffect(() => {
    if (!mounted || !user.value) return;
    fetchCourseProgress(courseId);
    fetchMyCourses();
    fetchMyProducts({}).then((res: any) => {
      const products: API.Product[] = res?.data ?? [];
      const match = products.find((p) =>
        p.productables?.some((item) => item.productable_id === courseId)
      );
      setAccessExpiry(match?.end_date ?? null);
    });
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

  const isTopicFinished = (tid: number) =>
    topicProgressList.some((p) => p.topic_id === tid && p.status === 1);

  const progressPct = useMemo(() => {
    if (!allTopics.length) return 0;
    const done = allTopics.filter((t) => isTopicFinished(t.id)).length;
    return Math.round((done / allTopics.length) * 100);
  }, [allTopics, topicProgressList]);

  const isEnrolled = useMemo(() => {
    const val = (myCourses as any)?.value;
    if (!val) return false;
    // API returns { ids: number[] }
    if (Array.isArray(val?.ids)) return val.ids.includes(courseId);
    // Fallback: plain array of numbers or objects
    if (Array.isArray(val)) {
      return val.some((item: any) =>
        typeof item === "number" ? item === courseId : item?.id === courseId
      );
    }
    return false;
  }, [myCourses, courseId]);

  const resumeTopic = useMemo(() => {
    if (!allTopics.length) return null;
    return allTopics.find((t) => !isTopicFinished(t.id)) ?? null;
  }, [allTopics, topicProgressList]);

  const firstTopic = allTopics[0] ?? null;

  async function handleEnroll() {
    setEnrolling(true);
    setEnrollError("");
    try {
      const res = await addCourseAccess({ course_id: courseId });
      const msg = (res as any)?.data?.message ?? "";
      // "Enquiry already exists" means access was already requested/granted
      if (res.success || msg.toLowerCase().includes("already")) {
        await fetchMyCourses();
        await fetchCourseProgress(courseId);
        toast("You're enrolled! Start learning below.");
      } else {
        setEnrollError("Enrollment failed. Please try again.");
        toast("Enrollment failed. Please try again.", "error");
      }
    } catch {
      setEnrollError("Enrollment failed. Please try again.");
      toast("Enrollment failed. Please try again.", "error");
    } finally {
      setEnrolling(false);
    }
  }

  const loggedIn = mounted && !!user.value;

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-[#555555]">Loading...</div>;
  }

  if (!user.value) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-[#04323e] mb-3">Sign in to view this course</h2>
        <p className="text-[#555555] mb-6">You need an account to access course content.</p>
        <Link
          href="/"
          className="inline-block bg-[#1abc9c] hover:bg-[#15a288] text-white font-semibold px-8 py-3 rounded-full transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (!course) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-[#555555]">Course not found.</div>;
  }

  function renderCTA() {
    if (!loggedIn) {
      return (
        <p className="text-sm text-gray-400 text-center">
          <Link href="/" className="text-[#1abc9c] hover:underline font-medium">Sign in</Link> to enroll
        </p>
      );
    }
    if (!isEnrolled) {
      return (
        <>
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="block w-full text-center bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white font-semibold py-3 rounded-full transition-colors"
          >
            {enrolling ? "Enrolling…" : "Enroll now — it's free"}
          </button>
          {enrollError && <p className="text-sm text-red-600 text-center mt-2">{enrollError}</p>}
        </>
      );
    }
    if (progressPct === 100) {
      return (
        <Link
          href={`/courses/${courseId}/complete`}
          className="block w-full text-center border-2 border-[#1abc9c] text-[#1abc9c] hover:bg-[#1abc9c]/5 font-semibold py-3 rounded-full transition-colors"
        >
          View certificate
        </Link>
      );
    }
    return (
      <Link
        href={`/courses/${courseId}/topics/${resumeTopic?.id ?? firstTopic?.id}`}
        className="block w-full text-center bg-[#1abc9c] hover:bg-[#15a288] text-white font-semibold py-3 rounded-full transition-colors"
      >
        {progressPct > 0 ? "Resume course" : "Start learning"}
      </Link>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-[#1abc9c] transition-colors">Courses</Link>
        <span className="mx-2">›</span>
        <span className="text-[#04323e]">{course.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold text-[#04323e] mb-4">{course.title}</h1>
          {course.summary && <p className="text-lg text-[#555555] mb-4">{course.summary}</p>}

          <div className="flex flex-wrap gap-2 mb-6">
            {course.level && (
              <span className="text-xs font-medium bg-[#1abc9c]/10 text-[#1abc9c] px-3 py-1 rounded-full">{course.level}</span>
            )}
            {course.topic_count != null && (
              <span className="text-xs font-medium bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{course.topic_count} lessons</span>
            )}
            {course.duration && (
              <span className="text-xs font-medium bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{course.duration}</span>
            )}
          </div>

          {course.author && (
            <p className="text-sm text-gray-400">
              By{" "}
              <Link href={`/instructors/${course.author.id}`} className="font-medium text-[#555555] hover:text-[#1abc9c] transition-colors">
                {course.author.first_name} {course.author.last_name}
              </Link>
            </p>
          )}
        </div>

        <div className="border border-gray-100 rounded-xl p-6 bg-white shadow-sm h-fit space-y-4">
          {course.image_url && (
            <img src={course.image_url} alt={course.title} className="w-full rounded-lg object-cover aspect-video" />
          )}

          {isEnrolled && allTopics.length > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#1abc9c] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}

          {accessExpiry && isEnrolled && (
            <p className="text-xs text-gray-400 text-center">
              Access expires {new Date(accessExpiry).toLocaleDateString()}
            </p>
          )}

          {renderCTA()}
        </div>
      </div>

      {course.description && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-[#04323e] mb-3">About this course</h2>
          <div className="prose max-w-none text-[#555555]" dangerouslySetInnerHTML={{ __html: course.description }} />
        </div>
      )}

      {course.lessons && course.lessons.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-[#04323e] mb-4">Curriculum</h2>
          <CourseCurriculum lessons={course.lessons} courseId={courseId} isEnrolled={isEnrolled} />
        </div>
      )}
    </main>
  );
}
