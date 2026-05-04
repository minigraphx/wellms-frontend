"use client";

import { useState } from "react";

interface Props {
  chatUrl?: string;
  roomId?: string;
  label?: string;
}

export function ChatWidget({ chatUrl, roomId, label = "Chat" }: Props) {
  const url = chatUrl ?? process.env.NEXT_PUBLIC_CHAT_URL ?? "";
  const [open, setOpen] = useState(false);

  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center">
        <p className="text-2xl mb-3">💬</p>
        <p className="text-sm font-semibold text-[#04323e] mb-1">Messaging nicht konfiguriert</p>
        <p className="text-xs text-gray-400">
          Setze <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_CHAT_URL</code> in der{" "}
          <code className="bg-gray-100 px-1 rounded">.env</code>-Datei, um Rocket.Chat einzubinden.
        </p>
      </div>
    );
  }

  const embedUrl = roomId ? `${url}/channel/${roomId}?layout=embedded` : `${url}?layout=embedded`;

  return (
    <div className="relative">
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#1abc9c] hover:bg-[#15a288] text-white shadow-lg flex items-center justify-center transition-all"
        aria-label={open ? "Chat schließen" : "Chat öffnen"}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-[#04323e] text-white shrink-0">
            <span className="text-sm font-semibold">{label}</span>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Chat schließen"
            >
              ✕
            </button>
          </div>
          <iframe
            src={embedUrl}
            className="flex-1 w-full border-0"
            title={label}
            allow="camera; microphone"
          />
        </div>
      )}
    </div>
  );
}
