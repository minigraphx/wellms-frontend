"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { API } from "@escolalms/sdk/lib";

interface Props {
  enrolledTitles: string[];
  allCourses: API.CourseListItem[];
  enrolledIds: Set<number>;
}

const CACHE_KEY = "ai_recommendations_v1";

export function RecommendedCourses({ enrolledTitles, allCourses, enrolledIds }: Props) {
  const [recommended, setRecommended] = useState<API.CourseListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unenrolled = allCourses.filter((c) => !enrolledIds.has(c.id));
    if (!enrolledTitles.length || unenrolled.length === 0) return;

    const cacheRaw = sessionStorage.getItem(CACHE_KEY);
    if (cacheRaw) {
      try {
        const ids: number[] = JSON.parse(cacheRaw);
        const picked = ids.map((id) => unenrolled.find((c) => c.id === id)).filter(Boolean) as API.CourseListItem[];
        if (picked.length) { setRecommended(picked); return; }
      } catch {}
    }

    setLoading(true);
    const catalog = unenrolled.slice(0, 30).map((c) => `${c.id}: ${c.title}`).join("\n");
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt:
          "Du bist ein Kursempfehlungssystem. Basierend auf den belegten Kursen eines Nutzers, wähle genau 3 passende Kurse aus dem Katalog aus. Antworte NUR mit einer kommaseparierten Liste der Kurs-IDs, zum Beispiel: 12,7,34",
        messages: [
          {
            role: "user",
            content: `Belegte Kurse:\n${enrolledTitles.join("\n")}\n\nVerfügbarer Katalog:\n${catalog}\n\nGib 3 Kurs-IDs zurück.`,
          },
        ],
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.content) return;
        const ids = (data.content as string)
          .split(/[,\s]+/)
          .map(Number)
          .filter((n) => !isNaN(n) && n > 0);
        const picked = ids
          .map((id) => unenrolled.find((c) => c.id === id))
          .filter(Boolean)
          .slice(0, 3) as API.CourseListItem[];
        if (picked.length) {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(picked.map((c) => c.id)));
          setRecommended(picked);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#04323e] mb-3">Empfohlen für dich</h2>
        <p className="text-sm text-gray-400 animate-pulse">KI analysiert deine Lernpräferenzen…</p>
      </div>
    );
  }

  if (!recommended.length) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-[#04323e] mb-3">Empfohlen für dich ✨</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {recommended.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {course.image_url ? (
              <img src={course.image_url} alt={course.title} className="w-full h-28 object-cover" />
            ) : (
              <div className="w-full h-28 bg-gray-50" />
            )}
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-[#04323e] line-clamp-2">{course.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
