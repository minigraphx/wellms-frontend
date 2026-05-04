"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { PeerReview } from "./PeerReview";
import type { API } from "@escolalms/sdk/lib";

interface Props {
  topicId: number;
  topicTitle?: string;
}

export function ProjectUpload({ topicId, topicTitle }: Props) {
  const { user, apiUrl, token } = useContext(EscolaLMSContext) as any;
  const fileRef = useRef<HTMLInputElement>(null);

  const [submissions, setSubmissions] = useState<API.ProjectFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [showPeerReview, setShowPeerReview] = useState(false);

  const loadSubmissions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${apiUrl}/api/topic-project/${topicId}/question?per_page=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const json = await res.json();
        setSubmissions(json?.data ?? []);
      }
    } catch {}
  }, [apiUrl, token, topicId]);

  useEffect(() => {
    if (user.value) loadSubmissions();
  }, [user.value, loadSubmissions]);

  const handleUpload = useCallback(async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const form = new FormData();
      form.append("topic_id", String(topicId));
      form.append("file", file);
      const res = await fetch(`${apiUrl}/api/topic-project/${topicId}/solution`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (res.ok) {
        setSuccess("Assignment submitted successfully!");
        if (fileRef.current) fileRef.current.value = "";
        await loadSubmissions();
        setShowPeerReview(true);
        if (topicTitle) {
          setFeedbackLoading(true);
          try {
            const fbRes = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                systemPrompt:
                  "Du bist ein hilfreicher Tutor. Gib konstruktives erstes Feedback zu einer Projektabgabe. Sei ermutigend und konkret. Antworte auf Deutsch in 3-4 Sätzen.",
                messages: [
                  {
                    role: "user",
                    content: `Der Student hat eine Projektabgabe eingereicht für: "${topicTitle}". Gib allgemeines konstruktives Feedback.`,
                  },
                ],
              }),
            });
            const fbData = await fbRes.json();
            if (fbData.content) setAiFeedback(fbData.content);
          } catch {}
          setFeedbackLoading(false);
        }
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json?.message ?? "Upload failed. Please try again.");
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [apiUrl, token, topicId, topicTitle, loadSubmissions]);

  if (!user.value) {
    return <p className="text-gray-400 text-sm">Sign in to submit your assignment.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#1abc9c] transition-colors">
        <p className="text-4xl mb-2">📎</p>
        <p className="text-sm font-medium text-[#04323e] mb-1">Upload your assignment</p>
        <p className="text-xs text-gray-400 mb-4">Any file format accepted</p>
        <input
          ref={fileRef}
          type="file"
          id="project-upload"
          className="hidden"
          onChange={() => { setSuccess(""); setAiFeedback(null); }}
        />
        <label
          htmlFor="project-upload"
          className="inline-block cursor-pointer border border-gray-200 text-sm font-medium text-[#555555] hover:border-[#1abc9c] hover:text-[#1abc9c] px-4 py-2 rounded-full transition-colors"
        >
          Choose file
        </label>
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading}
        className="w-full bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white font-semibold py-3 rounded-full transition-colors"
      >
        {uploading ? "Uploading…" : "Submit assignment"}
      </button>

      {success && <p className="text-sm text-[#1abc9c] font-medium">{success}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {feedbackLoading && (
        <p className="text-sm text-amber-600 animate-pulse">KI analysiert deine Abgabe…</p>
      )}
      {aiFeedback && !feedbackLoading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 leading-relaxed">
          <p className="font-semibold mb-1">KI-Feedback</p>
          <p className="whitespace-pre-line">{aiFeedback}</p>
        </div>
      )}

      {showPeerReview && topicTitle && (
        <PeerReview topicId={topicId} topicTitle={topicTitle} />
      )}

      {submissions.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-[#04323e] mb-2">Previous submissions</h4>
          <ul className="space-y-2">
            {submissions.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm text-[#555555] bg-gray-50 rounded-lg px-3 py-2">
                <a
                  href={s.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1abc9c] hover:underline truncate"
                >
                  Submission #{s.id}
                </a>
                <span className="text-xs text-gray-400 shrink-0 ml-4">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
