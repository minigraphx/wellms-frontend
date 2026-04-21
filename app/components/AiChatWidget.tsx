"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  courseTitle?: string;
  topicTitle?: string;
}

export function AiChatWidget({ courseTitle, topicTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const systemPrompt = [
    "You are a helpful learning assistant for the Wellms LMS platform.",
    courseTitle && `The student is in the course: "${courseTitle}".`,
    topicTitle && `They are viewing the lesson: "${topicTitle}".`,
    "Help them understand the material, answer questions, and support their learning.",
    "Be concise, encouraging, and pedagogically clear.",
  ]
    .filter(Boolean)
    .join(" ");

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, systemPrompt }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content ?? "Sorry, I couldn't respond." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "An error occurred. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div
          className="mb-4 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: "480px" }}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-[#04323e] text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#1abc9c] flex items-center justify-center text-xs font-bold">
                AI
              </div>
              <span className="font-semibold text-sm">Learning Assistant</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-white/70 hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-6">
                {topicTitle
                  ? `Ask me anything about "${topicTitle}"`
                  : "Ask me anything about this course!"}
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#1abc9c] text-white rounded-br-sm"
                      : "bg-gray-100 text-[#555555] rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-xl rounded-bl-sm text-sm text-gray-400">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-gray-100 flex gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask a question…"
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="w-9 h-9 rounded-full bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors"
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close learning assistant" : "Open learning assistant"}
        className="w-14 h-14 rounded-full bg-[#1abc9c] hover:bg-[#15a288] text-white shadow-lg flex items-center justify-center transition-all hover:scale-105"
      >
        {open ? (
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
