import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { fetchCatalogue } from "./lib/publicApi";
import { getT } from "./i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: { absolute: t.catalog.metaTitle },
    description: t.catalog.metaDescription,
    alternates: { canonical: "/" },
  };
}

export default async function Home() {
  return <HomeClient initialCourses={await fetchCatalogue()} />;
}
