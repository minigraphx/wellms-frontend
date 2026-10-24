import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { fetchCatalogue } from "./lib/publicApi";

export const metadata: Metadata = {
  title: { absolute: "Online courses" },
  description: "Online courses and free preview lessons.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  return <HomeClient initialCourses={await fetchCatalogue()} />;
}
