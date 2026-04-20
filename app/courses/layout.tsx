"use client";

import { usePathname } from "next/navigation";
import { Nav } from "../components/Nav";

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTopicPlayer = /\/courses\/[^/]+\/topics\//.test(pathname);

  return (
    <>
      {!isTopicPlayer && <Nav />}
      {children}
    </>
  );
}
