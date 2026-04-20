"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { QuestionType } from "@escolalms/sdk/lib/types/enums";
import type { API } from "@escolalms/sdk/lib";

// ─── Types ──────────────────────────────────────────────────────────────────

type QuizQuestion = API.QuizQuestion;
type AnswerMap = Record<number, string | string[]>;

interface Props {
  topic: API.TopicQuiz;
  onComplete?: () => void;
}

// ─── Individual question renderers ──────────────────────────────────────────

function MultipleChoice({
  q,
  answer,
  onChange,
  multi,
}: {
  q: API.QuizQuestion_MultipleChoice | API.QuizQuestion_MultipleChoiceWithMultipleRightAnswers;
  answer: string | string[];
  onChange: (v: string | string[]) => void;
  multi: boolean;
}) {
  const answers: string[] = (q as any).options?.answers ?? [];
  const selected = Array.isArray(answer) ? answer : answer ? [answer] : [];

  function toggle(opt: string) {
    if (!multi) {
      onChange(opt);
    } else {
      const s = new Set(selected);
      if (s.has(opt)) s.delete(opt); else s.add(opt);
      onChange(Array.from(s));
    }
  }

  return (
    <div className="space-y-2">
      {answers.map((opt, i) => {
        const checked = multi ? selected.includes(opt) : answer === opt;
        return (
          <label
            key={i}
            className={`flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-colors ${
              checked ? "border-[#1abc9c] bg-[#1abc9c]/5" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type={multi ? "checkbox" : "radio"}
              checked={checked}
              onChange={() => toggle(opt)}
              className="accent-[#1abc9c]"
            />
            <span className="text-sm text-[#555555]">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function TrueFalse({ answer, onChange }: { answer: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-3">
      {["True", "False"].map((opt) => (
        <label
          key={opt}
          className={`flex items-center gap-2 px-6 py-3 border rounded-xl cursor-pointer transition-colors flex-1 justify-center ${
            answer === opt ? "border-[#1abc9c] bg-[#1abc9c]/5 font-medium" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <input
            type="radio"
            checked={answer === opt}
            onChange={() => onChange(opt)}
            className="accent-[#1abc9c]"
          />
          <span className="text-sm">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function ShortAnswer({ answer, onChange }: { answer: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={answer}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Your answer…"
      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
    />
  );
}

function Matching({
  q,
  answer,
  onChange,
}: {
  q: API.QuizQuestion_Matching;
  answer: string;
  onChange: (v: string) => void;
}) {
  const subQuestions: string[] = q.options?.sub_questions ?? [];
  const subAnswers: string[] = q.options?.sub_answers ?? [];

  const parsed: Record<string, string> = (() => {
    try { return JSON.parse(answer || "{}"); } catch { return {}; }
  })();

  function update(qText: string, aText: string) {
    const updated = { ...parsed, [qText]: aText };
    onChange(JSON.stringify(updated));
  }

  return (
    <div className="space-y-3">
      {subQuestions.map((sq, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-sm text-[#555555] flex-1">{sq}</span>
          <select
            value={parsed[sq] ?? ""}
            onChange={(e) => update(sq, e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c] bg-white"
          >
            <option value="">Select…</option>
            {subAnswers.map((sa, j) => (
              <option key={j} value={sa}>{sa}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function Numerical({ answer, onChange }: { answer: string; onChange: (v: string) => void }) {
  return (
    <input
      type="number"
      value={answer}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter a number…"
      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
    />
  );
}

function Essay({ answer, onChange }: { answer: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={answer}
      onChange={(e) => onChange(e.target.value)}
      rows={5}
      placeholder="Write your answer…"
      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c] resize-none"
    />
  );
}

// ─── Question dispatcher ─────────────────────────────────────────────────────

function QuestionCard({
  q,
  index,
  total,
  answer,
  onChange,
}: {
  q: QuizQuestion;
  index: number;
  total: number;
  answer: string | string[];
  onChange: (v: string | string[]) => void;
}) {
  const strAnswer = Array.isArray(answer) ? answer.join(",") : answer ?? "";
  const setStr = (v: string) => onChange(v);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-xs font-semibold bg-[#1abc9c]/10 text-[#1abc9c] px-2 py-1 rounded-full shrink-0 mt-0.5">
          {index + 1}/{total}
        </span>
        <div>
          <p className="font-semibold text-[#04323e]">{q.title}</p>
          {q.question && q.question !== q.title && (
            <p className="text-sm text-[#555555] mt-1">{q.question}</p>
          )}
        </div>
      </div>

      {q.type === QuestionType.MULTIPLE_CHOICE && (
        <MultipleChoice q={q as any} answer={strAnswer} onChange={(v) => onChange(v)} multi={false} />
      )}
      {q.type === QuestionType.MULTIPLE_CHOICE_WITH_MULTIPLE_RIGHT_ANSWERS && (
        <MultipleChoice q={q as any} answer={answer} onChange={onChange} multi={true} />
      )}
      {q.type === QuestionType.TRUE_FALSE && (
        <TrueFalse answer={strAnswer} onChange={(v) => onChange(v)} />
      )}
      {q.type === QuestionType.SHORT_ANSWERS && (
        <ShortAnswer answer={strAnswer} onChange={(v) => onChange(v)} />
      )}
      {q.type === QuestionType.MATCHING && (
        <Matching q={q as any} answer={strAnswer} onChange={(v) => onChange(v)} />
      )}
      {q.type === QuestionType.NUMERICAL_QUESTION && (
        <Numerical answer={strAnswer} onChange={(v) => onChange(v)} />
      )}
      {q.type === QuestionType.ESSAY && (
        <Essay answer={strAnswer} onChange={(v) => onChange(v)} />
      )}
      {q.type === QuestionType.DESCRIPTION && (
        <div className="bg-[#1abc9c]/5 border border-[#1abc9c]/20 rounded-xl px-4 py-3 text-sm text-[#555555]">
          {q.question}
        </div>
      )}
    </div>
  );
}

// ─── Main quiz player ─────────────────────────────────────────────────────────

export function GiftQuizPlayer({ topic, onComplete }: Props) {
  const ctx = useContext(EscolaLMSContext) as any;
  const { user, apiUrl, token } = ctx;

  const [attempt, setAttempt] = useState<API.QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState<{ result: number; max: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const quizId = topic.topicable?.id;

  const startAttempt = useCallback(async () => {
    if (!token || !quizId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiUrl}/api/topic-gift-quiz/attempt`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ topic_gift_quiz_id: quizId }),
      });
      const json = await res.json();
      const att = json?.data ?? null;
      setAttempt(att);
      setAnswers({});
      setCurrentIdx(0);
      setFinished(false);
      setScore(null);
    } catch {
      setError("Could not start quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, quizId]);

  const handleAnswer = useCallback(
    (questionId: number, value: string | string[]) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    []
  );

  const handleFinish = useCallback(async () => {
    if (!attempt || !token) return;
    setSubmitting(true);
    try {
      // Send each answer
      for (const [qIdStr, val] of Object.entries(answers)) {
        const qId = Number(qIdStr);
        const answerStr = Array.isArray(val) ? val.join(",") : val;
        await fetch(`${apiUrl}/api/topic-gift-quiz/answer`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ attempt_id: attempt.id, question_id: qId, answer: answerStr }),
        });
      }

      // Finish attempt
      const res = await fetch(`${apiUrl}/api/topic-gift-quiz/${attempt.id}/end`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const json = await res.json();
      const finished = json?.data ?? null;
      setScore({
        result: finished?.result_score ?? 0,
        max: finished?.max_score ?? attempt.max_score ?? 0,
      });
      setFinished(true);
      if (onComplete) onComplete();
    } catch {
      setError("Could not submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [apiUrl, token, attempt, answers, onComplete]);

  const questions: QuizQuestion[] = attempt?.questions ?? [];
  const maxAttempts = topic.topicable?.max_attempts;

  if (!user.value) {
    return <p className="text-gray-400 text-sm">Sign in to take this quiz.</p>;
  }

  if (finished && score) {
    const pct = score.max > 0 ? Math.round((score.result / score.max) * 100) : 0;
    const passed = pct >= 60;
    return (
      <div className="text-center space-y-6 py-8">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-3xl ${passed ? "bg-[#1abc9c]/10" : "bg-red-50"}`}>
          {passed ? "✓" : "✗"}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-[#04323e]">{passed ? "Quiz passed!" : "Quiz not passed"}</h3>
          <p className="text-[#555555] mt-1">
            Score: {score.result} / {score.max} ({pct}%)
          </p>
        </div>
        <button
          onClick={startAttempt}
          disabled={loading}
          className="bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-full transition-colors"
        >
          {loading ? "Starting…" : "Retake quiz"}
        </button>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="text-center space-y-4 py-8">
        <p className="text-4xl">📝</p>
        <h3 className="text-xl font-bold text-[#04323e]">{topic.title}</h3>
        {maxAttempts && (
          <p className="text-sm text-gray-400">Up to {maxAttempts} attempt{maxAttempts !== 1 ? "s" : ""}</p>
        )}
        {topic.topicable?.max_execution_time && (
          <p className="text-sm text-gray-400">Time limit: {topic.topicable.max_execution_time} minutes</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={startAttempt}
          disabled={loading}
          className="bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-full transition-colors"
        >
          {loading ? "Starting…" : "Start quiz"}
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Question {currentIdx + 1} of {questions.length}</span>
          <span>{Math.round(((currentIdx + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1abc9c] rounded-full transition-all"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {currentQ && (
        <QuestionCard
          q={currentQ}
          index={currentIdx}
          total={questions.length}
          answer={answers[currentQ.id] ?? ""}
          onChange={(v) => handleAnswer(currentQ.id, v)}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 justify-between">
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="px-5 py-2.5 rounded-full border border-gray-200 text-sm text-[#555555] hover:border-gray-300 disabled:opacity-40 transition-colors"
        >
          ← Previous
        </button>

        {isLast ? (
          <button
            onClick={handleFinish}
            disabled={submitting}
            className="px-6 py-2.5 rounded-full bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white font-semibold text-sm transition-colors"
          >
            {submitting ? "Submitting…" : "Submit quiz"}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
            className="px-5 py-2.5 rounded-full bg-[#1abc9c] hover:bg-[#15a288] text-white font-semibold text-sm transition-colors"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
