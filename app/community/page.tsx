"use client";

import { Nav } from "../components/Nav";
import { DiscourseEmbed } from "../components/DiscourseEmbed";

export default function CommunityPage() {
  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#04323e]">Community</h1>
          <p className="text-[#555555] mt-1">Diskutiere, stelle Fragen und vernetze dich mit anderen Lernenden.</p>
        </div>

        <DiscourseEmbed />
      </main>
    </>
  );
}
