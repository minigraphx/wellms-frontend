import type { Translation } from "../types";

export const de = {
  searchCourses: "Kurse durchsuchen",
  cart: (count: number) => (count > 0 ? `Warenkorb, ${count} Artikel` : "Warenkorb"),
  myCourses: "Meine Kurse",
  openUserMenu: "Benutzermenü öffnen",
  shop: "Shop",
  orders: "Bestellungen",
  bookmarks: "Lesezeichen",
  flashcards: "Lernkarten",
  profile: "Profil",
  tutorArea: "Kursleiter-Bereich",
  openMenu: "Menü öffnen",
  closeMenu: "Menü schliessen",
  switchLanguage: "Sprache wechseln",
};

export const en: Translation<typeof de> = {
  searchCourses: "Search courses",
  cart: (count: number) => (count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"),
  myCourses: "My courses",
  openUserMenu: "Open user menu",
  shop: "Shop",
  orders: "Orders",
  bookmarks: "Bookmarks",
  flashcards: "Flashcards",
  profile: "Profile",
  tutorArea: "Tutor area",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  switchLanguage: "Switch language",
};
