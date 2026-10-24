import type { Translation } from "../types";

export const de = {
  metaTitle: "Online-Kurse",
  metaDescription: "Online-Kurse und kostenlose Vorschaulektionen.",
  continueLearning: "Mach dort weiter, wo du aufgehört hast",
  searchPlaceholder: "Kurse suchen…",
  allCategoriesChip: "Alle",
  noCourses: "Keine Kurse gefunden.",
  loadMore: "Mehr laden",
  // Course card
  noImage: "Kein Bild",
  completed: "Abgeschlossen",
  inProgress: "In Bearbeitung",
  // Search page
  searchTitle: "Kurse durchsuchen",
  searchByTitle: "Nach Titel suchen…",
  allCategories: "Alle Kategorien",
  allLevels: "Alle Niveaus",
  clearFilters: "Filter zurücksetzen",
  coursesFound: (n: number) => (n === 1 ? "1 Kurs gefunden" : `${n} Kurse gefunden`),
  noMatch: "Keine Kurse passen zu deiner Suche.",
  clearFiltersRetry: "Filter zurücksetzen und erneut versuchen",
  // AI recommendations
  recommendedForYou: "Empfohlen für dich",
  analyzingPreferences: "KI analysiert deine Lernpräferenzen…",
  // Instructor page
  instructorNotFound: "Kursleiter nicht gefunden.",
  browseCourses: "Kurse ansehen",
  coursesBy: (name: string) => `Kurse von ${name}`,
  noCoursesYet: "Noch keine Kurse veröffentlicht.",
};

export const en: Translation<typeof de> = {
  metaTitle: "Online courses",
  metaDescription: "Online courses and free preview lessons.",
  continueLearning: "Continue learning where you left off",
  searchPlaceholder: "Search courses…",
  allCategoriesChip: "All",
  noCourses: "No courses found.",
  loadMore: "Load more",
  noImage: "No image",
  completed: "Completed",
  inProgress: "In Progress",
  searchTitle: "Search courses",
  searchByTitle: "Search by title…",
  allCategories: "All categories",
  allLevels: "All levels",
  clearFilters: "Clear filters",
  coursesFound: (n: number) => `${n} course${n === 1 ? "" : "s"} found`,
  noMatch: "No courses match your search.",
  clearFiltersRetry: "Clear filters and try again",
  recommendedForYou: "Recommended for you",
  analyzingPreferences: "AI is analysing your learning preferences…",
  instructorNotFound: "Instructor not found.",
  browseCourses: "Browse courses",
  coursesBy: (name: string) => `Courses by ${name}`,
  noCoursesYet: "No courses published yet.",
};
