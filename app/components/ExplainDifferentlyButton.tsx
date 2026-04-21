"use client";

import { useState } from "react";

interface Props {
  topicTitle: string;
}

export function ExplainDifferentlyButton({ topicTitle }: Props) {
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function explain() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Please explain "${topicTitle}" in a different, simpler way. Use a fresh analogy or a completely different angle to help someone who didn't fully grasp the original explanation.`,
            },
          ],
          systemPrompt:
            "You are a patient, creative teacher. When asked to explain something differently, use fresh analogies, simpler language, or a completely different approach. Be concise and clear.",
        }),
      });
      const data = await res.json();
      setExplanation(data.content ?? "");
    } catch {
      setError("Could not generate explanation. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!explanation) {
    return (
      <div className="mt-6">
        <button
          onClick={explain}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-medium text-[#1abc9c] hover:text-[#15a288] disabled:opacity-50 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {loading ? "Generating alternative explanation…" : "Explain differently"}
        </button>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-6 bg-[#1abc9c]/5 border border-[#1abc9c]/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[#04323e] flex items-center gap-2">
          <svg
            className="w-4 h-4 text-[#1abc9c]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          Alternative explanation
        </h4>
        <button
          onClick={() => setExplanation("")}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Dismiss
        </button>
      </div>
      <p className="text-sm text-[#555555] leading-relaxed whitespace-pre-wrap">{explanation}</p>
      <button
        onClick={explain}
        disabled={loading}
        className="text-xs text-[#1abc9c] hover:text-[#15a288] disabled:opacity-50 transition-colors"
      >
        {loading ? "Regenerating…" : "Try a different explanation"}
      </button>
    </div>
  );
}
