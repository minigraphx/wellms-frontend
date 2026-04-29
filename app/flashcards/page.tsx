"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "../components/Nav";

export interface Flashcard {
  id: string;
  topicId: number;
  topicTitle: string;
  question: string;
  answer: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string; // ISO date
}

const CARDS_KEY = "flashcards_v1";

export function loadCards(): Flashcard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveCards(cards: Flashcard[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

function sm2(card: Flashcard, quality: number): Flashcard {
  let { easeFactor, interval, repetitions } = card;
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  }
  const nextReview = new Date(Date.now() + interval * 86400000).toISOString().split("T")[0];
  return { ...card, easeFactor, interval, repetitions, nextReview };
}

const QUALITY_LABELS = ["Again", "Hard", "Okay", "Good", "Easy"];
const QUALITY_STYLES = [
  "border-red-300 text-red-600 hover:bg-red-50",
  "border-orange-300 text-orange-600 hover:bg-orange-50",
  "border-yellow-300 text-yellow-600 hover:bg-yellow-50",
  "border-[#1abc9c] text-[#1abc9c] hover:bg-[#1abc9c]/5",
  "border-blue-300 text-blue-600 hover:bg-blue-50",
];

export default function FlashcardsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionDone, setSessionDone] = useState(0);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted) setCards(loadCards());
  }, [mounted]);

  const due = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return cards.filter((c) => c.nextReview <= today);
  }, [cards]);

  const current = due[0] ?? null;

  const handleRate = useCallback((quality: number) => {
    if (!current) return;
    const updated = sm2(current, quality);
    const next = cards.map((c) => (c.id === updated.id ? updated : c));
    setCards(next);
    saveCards(next);
    setShowAnswer(false);
    setSessionDone((n) => n + 1);
  }, [current, cards]);

  if (!mounted) return null;

  const totalDue = due.length;
  const remaining = totalDue - sessionDone;

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#04323e]">Flashcards</h1>
          <span className="text-sm text-gray-400">{cards.length} Karten gesamt</span>
        </div>

        {cards.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🃏</p>
            <p className="text-[#555555] mb-2">Noch keine Flashcards erstellt.</p>
            <p className="text-sm text-gray-400 mb-6">Öffne eine Lektion und klicke auf „Flashcards generieren".</p>
            <Link href="/" className="inline-block bg-[#1abc9c] hover:bg-[#15a288] text-white font-semibold px-6 py-2.5 rounded-full transition-colors text-sm">
              Kurse durchsuchen
            </Link>
          </div>
        )}

        {cards.length > 0 && totalDue === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">✅</p>
            <p className="text-lg font-semibold text-[#04323e] mb-2">Alle Karten für heute gelernt!</p>
            <p className="text-sm text-gray-400">Komm morgen wieder, um fällige Karten zu wiederholen.</p>
          </div>
        )}

        {current && remaining > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Thema: {current.topicTitle}</span>
              <span>{remaining} noch fällig</span>
            </div>

            <div
              className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 min-h-48 flex flex-col justify-between cursor-pointer select-none"
              onClick={() => setShowAnswer((v) => !v)}
            >
              <p className="text-sm font-semibold text-[#1abc9c] uppercase tracking-wide mb-3">Frage</p>
              <p className="text-lg text-[#04323e] leading-relaxed">{current.question}</p>

              {showAnswer ? (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Antwort</p>
                  <p className="text-[#555555] leading-relaxed whitespace-pre-line">{current.answer}</p>
                </div>
              ) : (
                <p className="mt-6 text-sm text-gray-300 text-center">Klicken zum Aufdecken</p>
              )}
            </div>

            {showAnswer && (
              <div className="grid grid-cols-5 gap-2">
                {QUALITY_LABELS.map((label, q) => (
                  <button
                    key={q}
                    onClick={() => handleRate(q)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-colors ${QUALITY_STYLES[q]}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {!showAnswer && (
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full bg-[#1abc9c] hover:bg-[#15a288] text-white font-semibold py-3 rounded-full transition-colors"
              >
                Antwort zeigen
              </button>
            )}
          </div>
        )}

        {sessionDone > 0 && remaining === 0 && (
          <div className="mt-8 text-center">
            <p className="text-[#1abc9c] font-semibold">Session abgeschlossen — {sessionDone} Karten wiederholt!</p>
          </div>
        )}
      </main>
    </>
  );
}
