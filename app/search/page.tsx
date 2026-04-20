"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { CourseCard } from "../components/CourseCard";
import type { API } from "@escolalms/sdk/lib";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { courses, fetchCourses, categoryTree, fetchCategories, myCourses, fetchMyCourses, user } =
    useContext(EscolaLMSContext);

  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(
    searchParams.get("category_id") ? Number(searchParams.get("category_id")) : null
  );
  const [activeLevel, setActiveLevel] = useState<string | null>(searchParams.get("level") ?? null);
  const [allCourses, setAllCourses] = useState<API.CourseListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const appendRef = useRef(false);

  // Debounced query for API calls
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setMounted(true);
    fetchCategories();
  }, []);

  useEffect(() => {
    if (mounted && user.value) fetchMyCourses();
  }, [mounted, user.value]);

  // Sync filters → URL params (without navigation)
  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (activeCategoryId) params.set("category_id", String(activeCategoryId));
    if (activeLevel) params.set("level", activeLevel);
    const qs = params.toString();
    router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
  }, [debouncedQuery, activeCategoryId, activeLevel, mounted]);

  // Fetch courses when filters change
  useEffect(() => {
    if (!mounted) return;
    appendRef.current = false;
    setCurrentPage(1);
    const params: Record<string, unknown> = {};
    if (debouncedQuery) params.title = debouncedQuery;
    if (activeCategoryId) params.category_id = activeCategoryId;
    if (activeLevel) params.level = activeLevel;
    fetchCourses(params);
  }, [debouncedQuery, activeCategoryId, activeLevel, mounted]);

  // Accumulate pages
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
    if (debouncedQuery) params.title = debouncedQuery;
    if (activeCategoryId) params.category_id = activeCategoryId;
    if (activeLevel) params.level = activeLevel;
    fetchCourses(params);
  }, [currentPage, debouncedQuery, activeCategoryId, activeLevel, fetchCourses]);

  const meta = (courses.list as any)?.meta;
  const hasMore = meta ? currentPage < meta.last_page : false;
  const totalCount: number | null = meta?.total ?? null;

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

  function clearFilters() {
    setQuery("");
    setActiveCategoryId(null);
    setActiveLevel(null);
  }

  const hasFilters = !!query || activeCategoryId !== null || activeLevel !== null;

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#04323e] mb-6">Search courses</h1>

      {/* Search input */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title…"
        autoFocus
        className="w-full border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c] mb-6"
      />

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Category filter */}
        {categories.length > 0 && (
          <select
            value={activeCategoryId ?? ""}
            onChange={(e) => setActiveCategoryId(e.target.value ? Number(e.target.value) : null)}
            className="border border-gray-200 rounded-full px-4 py-1.5 text-sm text-[#555555] focus:outline-none focus:ring-2 focus:ring-[#1abc9c] bg-white"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}

        {/* Level filter */}
        <select
          value={activeLevel ?? ""}
          onChange={(e) => setActiveLevel(e.target.value || null)}
          className="border border-gray-200 rounded-full px-4 py-1.5 text-sm text-[#555555] focus:outline-none focus:ring-2 focus:ring-[#1abc9c] bg-white"
        >
          <option value="">All levels</option>
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-400 hover:text-[#1abc9c] transition-colors px-2"
          >
            Clear filters ×
          </button>
        )}
      </div>

      {/* Result count */}
      {mounted && !courses.loading && (
        <p className="text-sm text-gray-400 mb-4">
          {totalCount !== null
            ? `${totalCount} course${totalCount === 1 ? "" : "s"} found`
            : `${allCourses.length} course${allCourses.length === 1 ? "" : "s"} found`}
        </p>
      )}

      {/* Loading state */}
      {(!mounted || (courses.loading && allCourses.length === 0)) && (
        <p className="text-gray-500">Loading…</p>
      )}

      {/* Empty state */}
      {mounted && !courses.loading && allCourses.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No courses match your search.</p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-[#1abc9c] hover:underline"
            >
              Clear filters and try again
            </button>
          )}
        </div>
      )}

      {/* Results grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {allCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            isEnrolled={enrolledIds.has(course.id)}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={handleLoadMore}
            disabled={courses.loading}
            className="px-8 py-2.5 rounded-full border border-[#1abc9c] text-[#1abc9c] font-semibold text-sm hover:bg-[#1abc9c] hover:text-white transition-colors disabled:opacity-50"
          >
            {courses.loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </main>
  );
}
