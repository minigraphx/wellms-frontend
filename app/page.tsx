"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { CourseCard } from "./components/CourseCard";
import { Nav } from "./components/Nav";
import type { API } from "@escolalms/sdk/lib";

export default function Home() {
  const { courses, fetchCourses, user, categoryTree, fetchCategories, myCourses, fetchMyCourses } =
    useContext(EscolaLMSContext);

  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [allCourses, setAllCourses] = useState<API.CourseListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // When true, the next courses.list update should append instead of replace
  const appendRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    fetchCourses({});
    fetchCategories();
  }, []);

  useEffect(() => {
    if (mounted && user.value) fetchMyCourses();
  }, [mounted, user.value]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch on filter/search change (always resets to page 1)
  useEffect(() => {
    if (!mounted) return;
    appendRef.current = false;
    setCurrentPage(1);
    const params: Record<string, unknown> = {};
    if (debounced) params.title = debounced;
    if (activeCategoryId) params.category_id = activeCategoryId;
    fetchCourses(params);
  }, [debounced, activeCategoryId, mounted]);

  // Accumulate pages into allCourses
  useEffect(() => {
    if (!courses.list?.data) return;
    if (appendRef.current) {
      setAllCourses((prev) => [...prev, ...courses.list!.data]);
    } else {
      setAllCourses(courses.list.data);
    }
    appendRef.current = false;
  }, [courses.list]);

  const handleLoadMore = useCallback(() => {
    const nextPage = currentPage + 1;
    appendRef.current = true;
    setCurrentPage(nextPage);
    const params: Record<string, unknown> = { page: nextPage };
    if (debounced) params.title = debounced;
    if (activeCategoryId) params.category_id = activeCategoryId;
    fetchCourses(params);
  }, [currentPage, debounced, activeCategoryId, fetchCourses]);

  const meta = (courses.list as any)?.meta;
  const hasMore = meta ? currentPage < meta.last_page : false;

  const loggedIn = mounted && !!user.value;
  const categories: API.Category[] = (categoryTree as any)?.list ?? [];

  const enrolledIds = useMemo(() => {
    const val = (myCourses as any)?.value;
    if (!val) return new Set<number>();
    if (Array.isArray(val?.ids)) return new Set<number>(val.ids);
    if (Array.isArray(val)) {
      return new Set<number>(
        val
          .map((item: unknown) =>
            typeof item === "number" ? item : (item as { id?: number })?.id
          )
          .filter((id): id is number => typeof id === "number")
      );
    }
    return new Set<number>();
  }, [myCourses]);

  function handleCategory(id: number | null) {
    setActiveCategoryId(id);
    setSearch("");
  }

  if (!mounted || (courses.loading && allCourses.length === 0)) {
    return (
      <>
        <Nav />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-[#04323e] mb-8">Courses</h1>
          <p className="text-gray-500">Loading...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-12">
        {loggedIn && (
          <div className="mb-6 flex items-center justify-between bg-[#04323e]/5 rounded-xl px-5 py-4">
            <p className="text-sm text-[#04323e] font-medium">Continue learning where you left off</p>
            <Link href="/dashboard" className="text-sm font-semibold text-[#1abc9c] hover:underline">
              My courses →
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 gap-4">
          <h1 className="text-3xl font-bold text-[#04323e]">Courses</h1>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActiveCategoryId(null);
            }}
            placeholder="Search courses…"
            className="border border-gray-200 rounded-full px-4 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
            <button
              onClick={() => handleCategory(null)}
              className={`shrink-0 text-sm font-medium px-4 py-1.5 rounded-full border transition-colors ${
                activeCategoryId === null
                  ? "bg-[#1abc9c] border-[#1abc9c] text-white"
                  : "border-gray-200 text-[#555555] hover:border-[#1abc9c] hover:text-[#1abc9c]"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategory(cat.id)}
                className={`shrink-0 text-sm font-medium px-4 py-1.5 rounded-full border transition-colors ${
                  activeCategoryId === cat.id
                    ? "bg-[#1abc9c] border-[#1abc9c] text-white"
                    : "border-gray-200 text-[#555555] hover:border-[#1abc9c] hover:text-[#1abc9c]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {allCourses.length === 0 && !courses.loading && (
          <p className="text-gray-500">No courses found.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={enrolledIds.has(course.id)}
              progressPct={enrolledIds.has(course.id) ? undefined : undefined}
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={handleLoadMore}
              disabled={courses.loading}
              data-testid="load-more"
              className="px-8 py-2.5 rounded-full border border-[#1abc9c] text-[#1abc9c] font-semibold text-sm hover:bg-[#1abc9c] hover:text-white transition-colors disabled:opacity-50"
            >
              {courses.loading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </main>
    </>
  );
}
