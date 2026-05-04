"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";

interface Comment {
  id: string;
  topicId: number;
  author: string;
  body: string;
  ts: number;
}

function storageKey(topicId: number) {
  return `topic_comments_${topicId}`;
}

interface Props {
  topicId: number;
  isEnrolled: boolean;
}

export function TopicComments({ topicId, isEnrolled }: Props) {
  const { user } = useContext(EscolaLMSContext);
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(topicId));
      if (raw) setComments(JSON.parse(raw));
    } catch {}
  }, [topicId]);

  function saveComments(next: Comment[]) {
    setComments(next);
    localStorage.setItem(storageKey(topicId), JSON.stringify(next));
  }

  function handleSubmit() {
    const text = body.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    const u = user.value as any;
    const author = u?.first_name
      ? `${u.first_name} ${u.last_name ?? ""}`.trim()
      : u?.email ?? "Anonym";
    const comment: Comment = {
      id: `${topicId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      topicId,
      author,
      body: text,
      ts: Date.now(),
    };
    saveComments([comment, ...comments]);
    setBody("");
    setSubmitting(false);
  }

  function handleDelete(id: string) {
    saveComments(comments.filter((c) => c.id !== id));
  }

  const u = user.value as any;
  const currentUserEmail = u?.email;

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex items-center gap-2 text-sm font-semibold text-[#04323e] hover:text-[#1abc9c] transition-colors"
      >
        <span>{open ? "▾" : "▸"}</span>
        Kommentare {comments.length > 0 && `(${comments.length})`}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {!isEnrolled || !user.value ? (
            <p className="text-sm text-gray-400">
              {user.value
                ? "Schreibe dich in den Kurs ein, um Kommentare zu hinterlassen."
                : "Melde dich an, um Kommentare zu schreiben."}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                ref={inputRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
                }}
                placeholder="Kommentar schreiben… (Strg+Enter zum Senden)"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1abc9c] resize-none"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !body.trim()}
                className="self-end bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
              >
                Kommentar posten
              </button>
            </div>
          )}

          {comments.length === 0 ? (
            <p className="text-sm text-gray-400">Noch keine Kommentare. Sei der Erste!</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#1abc9c]/10 text-[#1abc9c] text-xs font-bold flex items-center justify-center shrink-0">
                        {c.author[0]?.toUpperCase() ?? "?"}
                      </div>
                      <span className="text-xs font-semibold text-[#04323e] truncate">{c.author}</span>
                      <span className="text-xs text-gray-300 shrink-0">
                        {new Date(c.ts).toLocaleDateString("de-DE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {currentUserEmail && c.author !== "Anonym" && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-gray-300 hover:text-red-400 text-xs transition-colors shrink-0"
                        title="Kommentar löschen"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-[#555555] mt-2 leading-relaxed whitespace-pre-line">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
