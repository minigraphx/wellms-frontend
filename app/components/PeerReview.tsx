"use client";

import { useCallback, useState } from "react";

interface RubricCriterion {
  key: string;
  label: string;
  description: string;
}

const RUBRIC: RubricCriterion[] = [
  { key: "clarity", label: "Klarheit", description: "Wie klar und verständlich ist die Abgabe?" },
  { key: "completeness", label: "Vollständigkeit", description: "Werden alle Anforderungen erfüllt?" },
  { key: "creativity", label: "Kreativität", description: "Zeigt die Abgabe eigene Ideen und Originalität?" },
];

interface Props {
  topicId: number;
  topicTitle: string;
}

interface Review {
  scores: Record<string, number>;
  comment: string;
  ts: number;
}

function storageKey(topicId: number) {
  return `peer_review_${topicId}`;
}

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-xl transition-transform hover:scale-110 disabled:cursor-default"
          aria-label={`${star} Sterne`}
        >
          <span className={(hover || value) >= star ? "text-amber-400" : "text-gray-200"}>★</span>
        </button>
      ))}
    </div>
  );
}

export function PeerReview({ topicId, topicTitle }: Props) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [submitted, setSubmitted] = useState(() => {
    try {
      return !!localStorage.getItem(storageKey(topicId));
    } catch {
      return false;
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const allScored = RUBRIC.every((c) => (scores[c.key] ?? 0) > 0);

  const fetchAiSuggestion = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt:
            "Du bist ein hilfreicher Tutor. Erstelle einen konstruktiven, ermutigenden Peer-Review-Kommentar für eine Projektabgabe. Der Kommentar sollte 2-3 Sätze lang sein, konkret und hilfreich. Antworte auf Deutsch.",
          messages: [
            {
              role: "user",
              content: `Thema: "${topicTitle}". Bewertungen: ${RUBRIC.map(
                (c) => `${c.label}: ${scores[c.key] ?? 0}/5`
              ).join(", ")}. Schreibe einen passenden Peer-Review-Kommentar.`,
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.content) setComment(data.content);
    } catch {}
    setAiLoading(false);
  }, [topicTitle, scores]);

  function handleSubmit() {
    if (!allScored || !comment.trim()) return;
    setSubmitting(true);
    const review: Review = { scores, comment: comment.trim(), ts: Date.now() };
    try {
      localStorage.setItem(storageKey(topicId), JSON.stringify(review));
    } catch {}
    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="mt-6 rounded-xl border border-[#1abc9c]/30 bg-[#1abc9c]/5 px-5 py-4">
        <p className="text-sm font-semibold text-[#1abc9c]">✓ Peer-Review eingereicht</p>
        <p className="text-xs text-gray-400 mt-0.5">Danke für dein Feedback!</p>
      </div>
    );
  }

  return (
    <div className="mt-6 border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div>
          <p className="text-sm font-semibold text-[#04323e]">Peer Review schreiben</p>
          <p className="text-xs text-gray-400 mt-0.5">Bewerte die Abgabe eines Mitlernenden</p>
        </div>
        <span className="text-gray-400 text-xs">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="px-5 py-5 space-y-5">
          {RUBRIC.map((criterion) => (
            <div key={criterion.key}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-[#04323e]">{criterion.label}</p>
                <StarRating
                  value={scores[criterion.key] ?? 0}
                  onChange={(v) => setScores((s) => ({ ...s, [criterion.key]: v }))}
                />
              </div>
              <p className="text-xs text-gray-400">{criterion.description}</p>
            </div>
          ))}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[#04323e]">Kommentar</p>
              <button
                onClick={fetchAiSuggestion}
                disabled={!allScored || aiLoading}
                className="text-xs text-[#1abc9c] hover:underline disabled:opacity-40 disabled:no-underline"
              >
                {aiLoading ? "KI denkt…" : "✨ KI-Vorschlag"}
              </button>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Schreibe deinen Review-Kommentar…"
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1abc9c] resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !allScored || !comment.trim()}
            className="w-full bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white font-semibold py-2.5 rounded-full text-sm transition-colors"
          >
            Review einreichen
          </button>
        </div>
      )}
    </div>
  );
}
