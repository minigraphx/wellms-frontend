"use client";

import { useEffect, useRef, useState } from "react";
import { useFormat, useT } from "../i18n/I18nProvider";

interface QAEntry {
  question: string;
  answer: string;
  ts: number;
}

interface Props {
  topicId: number;
  topicTitle: string;
}

function storageKey(topicId: number) {
  return `topic_qa_${topicId}`;
}

export function TopicQA({ topicId, topicTitle }: Props) {
  const [entries, setEntries] = useState<QAEntry[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const t = useT();
  const { date } = useFormat();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(topicId));
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
  }, [topicId]);

  async function handleAsk() {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: `Du bist ein hilfreicher Lernassistent für den Kurs-Inhalt "${topicTitle}". Beantworte Lernerfragen klar und präzise auf Deutsch. Wenn du die Antwort nicht weißt, sag es ehrlich.`,
          messages: [{ role: "user", content: q }],
        }),
      });
      const data = await res.json();
      if (data.content) {
        const entry: QAEntry = { question: q, answer: data.content, ts: Date.now() };
        const next = [entry, ...entries].slice(0, 20);
        setEntries(next);
        localStorage.setItem(storageKey(topicId), JSON.stringify(next));
        setQuestion("");
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <button
        onClick={() => { setOpen((v) => !v); if (!open) setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 text-sm font-semibold text-[#04323e] hover:text-[#1abc9c] transition-colors"
      >
        <span>{open ? "▾" : "▸"}</span>
        {t.player.qa.title} {entries.length > 0 && `(${entries.length})`}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-2">
            <textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAsk();
              }}
              placeholder={t.player.qa.placeholder}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1abc9c] resize-none"
            />
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="self-end bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
            >
              {loading ? t.player.qa.answering : t.player.qa.ask}
            </button>
            {error && (
              <p className="text-xs text-red-500">{t.player.qa.error}</p>
            )}
          </div>

          {entries.length > 0 && (
            <ul className="space-y-4">
              {entries.map((e) => (
                <li key={e.ts} className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                  <p className="text-sm font-semibold text-[#04323e]">{t.player.qa.questionPrefix} {e.question}</p>
                  <p className="text-sm text-[#555555] whitespace-pre-line leading-relaxed">{t.player.qa.answerPrefix} {e.answer}</p>
                  <p className="text-xs text-gray-300">{date(e.ts, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
