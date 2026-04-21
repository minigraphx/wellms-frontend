"use client";

import { useEffect, useRef, useState } from "react";

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
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    } catch {}
    setLoading(false);
  }

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <button
        onClick={() => { setOpen((v) => !v); if (!open) setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 text-sm font-semibold text-[#04323e] hover:text-[#1abc9c] transition-colors"
      >
        <span>{open ? "▾" : "▸"}</span>
        Fragen & Antworten {entries.length > 0 && `(${entries.length})`}
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
              placeholder="Stelle eine Frage zu diesem Thema… (Strg+Enter zum Senden)"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1abc9c] resize-none"
            />
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="self-end bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
            >
              {loading ? "KI antwortet…" : "Fragen"}
            </button>
          </div>

          {entries.length > 0 && (
            <ul className="space-y-4">
              {entries.map((e) => (
                <li key={e.ts} className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                  <p className="text-sm font-semibold text-[#04323e]">F: {e.question}</p>
                  <p className="text-sm text-[#555555] whitespace-pre-line leading-relaxed">A: {e.answer}</p>
                  <p className="text-xs text-gray-300">{new Date(e.ts).toLocaleString("de-DE")}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
