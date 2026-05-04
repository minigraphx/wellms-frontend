"use client";

import { useEffect, useId, useRef } from "react";

interface Props {
  discourseUrl?: string;
  topicId?: number;
  embedClass?: string;
}

declare global {
  interface Window {
    discourseEmbedOptions?: Record<string, unknown>;
  }
}

export function DiscourseEmbed({ discourseUrl, topicId, embedClass = "discourse-embed" }: Props) {
  const url = discourseUrl ?? process.env.NEXT_PUBLIC_DISCOURSE_URL ?? "";
  const embedId = useId().replace(/:/g, "");
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!url) return;

    window.discourseEmbedOptions = {
      discourseUrl: url,
      ...(topicId ? { topicId } : {}),
      embedClass,
    };

    const s = document.createElement("script");
    s.src = `${url}/javascripts/embed.js`;
    s.async = true;
    scriptRef.current = s;
    document.body.appendChild(s);

    return () => {
      scriptRef.current?.remove();
      scriptRef.current = null;
    };
  }, [url, topicId]);

  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
        <p className="text-2xl mb-3">💬</p>
        <p className="text-sm font-semibold text-[#04323e] mb-1">Diskussionsforum nicht konfiguriert</p>
        <p className="text-xs text-gray-400">
          Setze <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_DISCOURSE_URL</code> in der{" "}
          <code className="bg-gray-100 px-1 rounded">.env</code>-Datei, um Discourse einzubinden.
        </p>
      </div>
    );
  }

  return <div id={embedId} className={embedClass} />;
}
