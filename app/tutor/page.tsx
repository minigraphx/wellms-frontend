"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { Nav } from "../components/Nav";
import { useFormat, useT } from "../i18n/I18nProvider";
import type { API } from "@escolalms/sdk/lib";

function isTutor(u: API.UserAsProfile | null): boolean {
  if (!u) return false;
  const roles: unknown = (u as any).roles;
  if (Array.isArray(roles)) {
    return roles.some((r: any) =>
      typeof r === "string"
        ? r === "author" || r === "tutor"
        : r?.name === "author" || r?.name === "tutor"
    );
  }
  return false;
}

// Known booking statuses get a translated label; anything else from the API is shown as is.
function statusLabel(status: string | undefined, labels: Record<"pending" | "approved" | "rejected", string>): string {
  if (!status) return labels.pending;
  return Object.hasOwn(labels, status) ? labels[status as keyof typeof labels] : status;
}

export default function TutorPage() {
  const router = useRouter();
  const t = useT();
  const { date } = useFormat();
  const tt = t.learner.tutor;
  const ctx = useContext(EscolaLMSContext);
  const { user, fetchTutorConsultations } = ctx;
  const fetchMyAuthoredCourses = (ctx as any).fetchMyAuthoredCourses as
    | ((params?: API.PaginationParams) => Promise<void>)
    | undefined;

  const [mounted, setMounted] = useState(false);
  const [courses, setCourses] = useState<API.CourseListItem[]>([]);
  const [consultations, setConsultations] = useState<API.AppointmentTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [tipLoading, setTipLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user.value) { router.push("/"); return; }
    if (!isTutor(user.value as API.UserAsProfile)) { router.push("/dashboard"); return; }

    setLoading(true);
    const tasks: Promise<unknown>[] = [];

    if (fetchMyAuthoredCourses) {
      tasks.push(
        (fetchMyAuthoredCourses() as Promise<any>).then(() => {
          const data: API.Course[] = (ctx as any).myAuthoredCourses?.list?.data ?? [];
          if (Array.isArray(data)) setCourses(data);
        }).catch(() => {
          const fallback: API.Course[] = (ctx as any).myAuthoredCourses?.list?.data ?? [];
          if (Array.isArray(fallback)) setCourses(fallback);
        })
      );
    }

    tasks.push(
      fetchTutorConsultations().then((res: any) => {
        const data = res?.data ?? [];
        if (Array.isArray(data)) setConsultations(data);
      }).catch(() => {})
    );

    Promise.all(tasks).finally(() => setLoading(false));
  }, [mounted, user.value]);

  const fetchAiTip = useCallback(async (courseTitles: string[]) => {
    setTipLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt:
            "Du bist ein Coaching-Experte für Online-Kurse. Gib einen konkreten, umsetzbaren Tipp für einen Kursersteller, um die Lernmotivation seiner Teilnehmer zu steigern. Antworte auf Deutsch in 2-3 Sätzen.",
          messages: [
            {
              role: "user",
              content: courseTitles.length
                ? `Meine Kurse: ${courseTitles.join(", ")}. Was kann ich verbessern?`
                : "Ich erstelle Online-Kurse. Was kann ich verbessern?",
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.content) setAiTip(data.content);
    } catch {}
    setTipLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && courses.length > 0 && !aiTip && !tipLoading) {
      fetchAiTip(courses.map((c) => c.title));
    }
  }, [loading, courses]);

  if (!mounted) return null;
  if (!user.value || !isTutor(user.value as API.UserAsProfile)) return null;

  const u = user.value as API.UserAsProfile;

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#04323e]">{tt.title}</h1>
          <p className="text-[#555555] mt-1">{tt.welcome(u.first_name || u.email)}</p>
        </div>

        {(aiTip || tipLoading) && (
          <div className="mb-8 rounded-xl border border-[#1abc9c]/30 bg-[#1abc9c]/5 px-5 py-4">
            <p className="text-xs font-semibold text-[#1abc9c] mb-1">{tt.aiTip}</p>
            {tipLoading ? (
              <p className="text-sm text-gray-400 animate-pulse">{tt.aiTipLoading}</p>
            ) : (
              <p className="text-sm text-[#04323e] leading-relaxed">{aiTip}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Authored courses */}
          <section>
            <h2 className="text-lg font-semibold text-[#04323e] mb-4">{tt.myCourses}</h2>
            {loading && <p className="text-sm text-gray-400">{t.common.loading}</p>}
            {!loading && courses.length === 0 && (
              <p className="text-sm text-gray-400">{tt.noCourses}</p>
            )}
            <ul className="space-y-3">
              {courses.map((course) => (
                <li key={course.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex gap-4 items-center">
                  {course.image_url ? (
                    <img
                      src={course.image_url}
                      alt={course.title}
                      className="w-16 h-12 object-cover rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-gray-100 rounded-lg shrink-0" />
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-sm font-semibold text-[#04323e] hover:text-[#1abc9c] transition-colors line-clamp-1"
                    >
                      {course.title}
                    </Link>
                    {(course as any).users_count !== undefined && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {tt.participants(Number((course as any).users_count))}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Consultation bookings */}
          <section>
            <h2 className="text-lg font-semibold text-[#04323e] mb-4">{tt.bookings}</h2>
            {loading && <p className="text-sm text-gray-400">{t.common.loading}</p>}
            {!loading && consultations.length === 0 && (
              <p className="text-sm text-gray-400">{tt.noBookings}</p>
            )}
            <ul className="space-y-3">
              {consultations.map((term, i) => (
                <li
                  key={(term as any).id ?? i}
                  className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-[#04323e]">
                    {(term as any).consultation?.title ?? tt.consultation}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(term as any).date
                      ? date((term as any).date, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                      : tt.datePending}
                  </p>
                  <p className={`text-xs mt-1 font-medium ${
                    (term as any).status === "approved"
                      ? "text-[#1abc9c]"
                      : (term as any).status === "rejected"
                      ? "text-red-500"
                      : "text-amber-500"
                  }`}>
                    {statusLabel((term as any).status, tt.status)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
