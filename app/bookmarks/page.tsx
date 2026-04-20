"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { Nav } from "../components/Nav";
import type { API } from "@escolalms/sdk/lib";

export default function BookmarksPage() {
  const { user, fetchBookmarkNotes, deleteBookmarkNote } = useContext(EscolaLMSContext);
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [bookmarks, setBookmarks] = useState<API.BookmarkNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!user.value) { router.push("/"); return; }
    fetchBookmarkNotes({})
      .then((res: any) => setBookmarks(res?.data ?? []))
      .finally(() => setLoading(false));
  }, [mounted, user.value]);

  const handleDelete = useCallback(async (id: number) => {
    await deleteBookmarkNote(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, [deleteBookmarkNote]);

  if (!mounted || !user.value) return null;

  const topicBookmarks = bookmarks.filter((b) => (b as any).bookmarkable_type?.includes("Topic"));
  const courseBookmarks = bookmarks.filter((b) => (b as any).bookmarkable_type?.includes("Course"));

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-[#04323e] mb-8">Bookmarks</h1>

        {loading && <p className="text-gray-500">Loading…</p>}

        {!loading && bookmarks.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">☆</p>
            <p className="text-gray-400 text-lg mb-4">No bookmarks yet.</p>
            <p className="text-sm text-gray-400">Star any lesson while learning to bookmark it here.</p>
          </div>
        )}

        {topicBookmarks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[#04323e] mb-4">Lessons</h2>
            <ul className="space-y-3">
              {topicBookmarks.map((b) => {
                const bk = b as any;
                const topicId = bk.bookmarkable_id;
                const courseId = bk.bookmarkable?.course_id;
                const title = bk.bookmarkable?.title ?? `Lesson #${topicId}`;
                const courseTitle = bk.bookmarkable?.course_title ?? "";
                return (
                  <li key={b.id} className="flex items-start justify-between gap-4 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <div className="min-w-0">
                      <Link
                        href={courseId ? `/courses/${courseId}/topics/${topicId}` : "#"}
                        className="font-medium text-[#04323e] hover:text-[#1abc9c] transition-colors"
                      >
                        {title}
                      </Link>
                      {courseTitle && (
                        <p className="text-xs text-gray-400 mt-0.5">{courseTitle}</p>
                      )}
                      {bk.value && (
                        <p className="text-sm text-[#555555] mt-2 italic">"{bk.value}"</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(b.id)}
                      aria-label="Remove bookmark"
                      className="text-gray-300 hover:text-red-400 transition-colors shrink-0 text-lg"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {courseBookmarks.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-[#04323e] mb-4">Courses</h2>
            <ul className="space-y-3">
              {courseBookmarks.map((b) => {
                const bk = b as any;
                return (
                  <li key={b.id} className="flex items-start justify-between gap-4 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <Link
                      href={`/courses/${bk.bookmarkable_id}`}
                      className="font-medium text-[#04323e] hover:text-[#1abc9c] transition-colors"
                    >
                      Course #{bk.bookmarkable_id}
                    </Link>
                    <button
                      onClick={() => handleDelete(b.id)}
                      aria-label="Remove bookmark"
                      className="text-gray-300 hover:text-red-400 transition-colors shrink-0 text-lg"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
