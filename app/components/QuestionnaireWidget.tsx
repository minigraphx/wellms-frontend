"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import type { API } from "@escolalms/sdk/lib";

interface Props {
  modelTypeTitle: string; // e.g. "Course"
  modelId: number;
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`${star} stars`}
          className="text-2xl transition-colors"
        >
          <span className={(hover || value) >= star ? "text-[#f2c94c]" : "text-gray-200"}>★</span>
        </button>
      ))}
    </div>
  );
}

export function QuestionnaireWidget({ modelTypeTitle, modelId }: Props) {
  const { fetchQuestionnaires, sendQuestionnaireAnswer, user } = useContext(EscolaLMSContext);

  const [questionnaires, setQuestionnaires] = useState<API.Questionnaire[]>([]);
  const [answers, setAnswers] = useState<Record<number, { rate?: number; note?: string }>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user.value) return;
    fetchQuestionnaires(modelTypeTitle, modelId)
      .then((res: any) => {
        const items: API.Questionnaire[] = res?.data ?? [];
        setQuestionnaires(items.filter((q) => q.active));
      })
      .finally(() => setLoaded(true));
  }, [modelTypeTitle, modelId, user.value]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        for (const q of questionnaires) {
          const ans = answers[q.id];
          if (!ans) continue;
          await sendQuestionnaireAnswer(modelTypeTitle, modelId, q.id, {
            rate: ans.rate ?? null,
            note: ans.note ?? "",
          } as any);
        }
        setSubmitted(true);
      } finally {
        setSubmitting(false);
      }
    },
    [questionnaires, answers, modelTypeTitle, modelId, sendQuestionnaireAnswer]
  );

  if (!user.value || !loaded || questionnaires.length === 0) return null;

  if (submitted) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm text-center">
        <p className="text-[#1abc9c] font-semibold">✓ Thanks for your feedback!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
      <h3 className="text-lg font-semibold text-[#04323e]">Rate this course</h3>

      {questionnaires.map((q) => (
        <div key={q.id} className="space-y-3">
          {q.questions.filter((qn) => qn.active).map((question) => (
            <div key={question.id} className="space-y-2">
              <p className="font-medium text-[#04323e] text-sm">{question.title}</p>
              {question.description && (
                <p className="text-xs text-gray-400">{question.description}</p>
              )}

              {question.type === "rate" && (
                <StarRating
                  value={answers[q.id]?.rate ?? 0}
                  onChange={(v) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [q.id]: { ...prev[q.id], rate: v },
                    }))
                  }
                />
              )}

              {(question.type === "review" || question.type === "text") && (
                <textarea
                  value={answers[q.id]?.note ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [q.id]: { ...prev[q.id], note: e.target.value },
                    }))
                  }
                  rows={3}
                  placeholder="Share your thoughts…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c] resize-none"
                />
              )}
            </div>
          ))}
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
      >
        {submitting ? "Submitting…" : "Submit feedback"}
      </button>
    </form>
  );
}
