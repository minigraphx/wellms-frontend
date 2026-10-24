"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { loadCards, saveCards } from "../flashcards/storage";
import type { Flashcard } from "../flashcards/storage";
import { useT } from "../i18n/I18nProvider";

interface Props {
  topicId: number;
  topicTitle: string;
  htmlContent: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);
}

function newCard(topicId: number, topicTitle: string, question: string, answer: string): Flashcard {
  return {
    id: `${topicId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    topicId,
    topicTitle,
    question,
    answer,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString().split("T")[0],
  };
}

export function GenerateFlashcardsButton({ topicId, topicTitle, htmlContent }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const { flashcards: labels } = useT().player;

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const text = stripHtml(htmlContent);
      if (text.length < 30) { setError(labels.tooLittleContent); setLoading(false); return; }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt:
            'Du bist ein Lernkarten-Generator. Erstelle 5–8 Flashcards aus dem Lerninhalt. Antworte NUR mit einem JSON-Array, keine Erklärungen davor oder danach. Format: [{"q":"Frage","a":"Antwort"},...]',
          messages: [
            {
              role: "user",
              content: `Thema: "${topicTitle}"\n\n${text}`,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!data.content) throw new Error("Keine Antwort");

      const jsonMatch = data.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Ungültiges Format");
      const pairs: { q: string; a: string }[] = JSON.parse(jsonMatch[0]);

      const existing = loadCards();
      const newCards = pairs
        .filter((p) => p.q && p.a)
        .map((p) => newCard(topicId, topicTitle, p.q, p.a));
      saveCards([...existing, ...newCards]);
      setCount(newCards.length);
      setDone(true);
    } catch {
      setError(labels.failed);
    }
    setLoading(false);
  }, [topicId, topicTitle, htmlContent, labels]);

  if (done) {
    return (
      <p className="text-sm text-[#1abc9c]">
        {labels.created(count)}{" "}
        <Link href="/flashcards" className="underline hover:no-underline">
          {labels.studyNow} →
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#555555] border border-gray-200 hover:border-[#1abc9c] hover:text-[#1abc9c] px-4 py-2 rounded-full transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="animate-spin">⟳</span> {labels.generating}
          </>
        ) : (
          <>🃏 {labels.generate}</>
        )}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
