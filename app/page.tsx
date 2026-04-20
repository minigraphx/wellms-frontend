"use client";

import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { CourseCard } from "./components/CourseCard";
import { Nav } from "./components/Nav";
import type { API } from "@escolalms/sdk/lib";

export default function Home() {
  const { courses, fetchCourses, user, categoryTree, fetchCategories } = useContext(EscolaLMSContext);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchCourses({});
    fetchCategories();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!mounted) return;
    const params: Record<string, unknown> = {};
    if (debounced) params.title = debounced;
    if (activeCategoryId) params.category_id = activeCategoryId;
    fetchCourses(params);
  }, [debounced, activeCategoryId, mounted]);

  const loggedIn = mounted && !!user.value;

  const categories: API.Category[] = (categoryTree as any)?.list ?? [];

  function handleCategory(id: number | null) {
    setActiveCategoryId(id);
    setSearch("");
  }

  if (!mounted || courses.loading) {
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
            onChange={(e) => { setSearch(e.target.value); setActiveCategoryId(null); }}
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

        {courses.list?.data.length === 0 && (
          <p className="text-gray-500">No courses found.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.list?.data.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </main>
    </>
  );
}
