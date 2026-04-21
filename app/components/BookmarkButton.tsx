"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { BookmarkableType } from "@escolalms/sdk/lib/types/enums";
import type { API } from "@escolalms/sdk/lib";

interface Props {
  topicId: number;
}

export function BookmarkButton({ topicId }: Props) {
  const { user, fetchBookmarkNotes, createBookmarkNote, deleteBookmarkNote, updateBookmarkNote } =
    useContext(EscolaLMSContext);

  const [bookmark, setBookmark] = useState<API.BookmarkNote | null>(null);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user.value) return;
    fetchBookmarkNotes({ bookmarkable_id: topicId, bookmarkable_type: BookmarkableType.Topic } as any)
      .then((res: any) => {
        const items: API.BookmarkNote[] = res?.data ?? [];
        const found = items[0] ?? null;
        setBookmark(found);
        setNote((found as any)?.value ?? "");
      });
  }, [topicId, user.value]);

  const handleToggle = useCallback(async () => {
    if (!user.value) return;
    if (bookmark) {
      await deleteBookmarkNote(bookmark.id);
      setBookmark(null);
      setNote("");
      setShowNote(false);
    } else {
      setSaving(true);
      try {
        const res = await createBookmarkNote({
          bookmarkable_id: topicId,
          bookmarkable_type: BookmarkableType.Topic,
          value: null,
        });
        const created = (res as any)?.data ?? null;
        setBookmark(created);
        setShowNote(true);
      } finally {
        setSaving(false);
      }
    }
  }, [bookmark, topicId, user.value, createBookmarkNote, deleteBookmarkNote]);

  const handleSaveNote = useCallback(async () => {
    if (!bookmark) return;
    setSaving(true);
    try {
      const res = await updateBookmarkNote(bookmark.id, {
        bookmarkable_id: topicId,
        bookmarkable_type: BookmarkableType.Topic,
        value: note || null,
      });
      const updated = (res as any)?.data ?? bookmark;
      setBookmark(updated);
      setShowNote(false);
    } finally {
      setSaving(false);
    }
  }, [bookmark, note, topicId, updateBookmarkNote]);

  if (!user.value) return null;

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        disabled={saving}
        aria-label={bookmark ? "Remove bookmark" : "Bookmark this lesson"}
        title={bookmark ? "Remove bookmark" : "Bookmark this lesson"}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
          bookmark ? "text-[#f2c94c]" : "text-gray-400 hover:text-[#f2c94c]"
        }`}
      >
        <span className="text-lg">{bookmark ? "★" : "☆"}</span>
        <span className="hidden sm:inline">{bookmark ? "Bookmarked" : "Bookmark"}</span>
      </button>

      {bookmark && (
        <button
          onClick={() => setShowNote((v) => !v)}
          className="ml-2 text-xs text-gray-400 hover:text-[#1abc9c] transition-colors"
        >
          {showNote ? "Hide note" : (bookmark as any)?.value ? "Edit note" : "Add note"}
        </button>
      )}

      {showNote && bookmark && (
        <div className="absolute right-0 top-8 z-10 bg-white border border-gray-100 rounded-xl shadow-lg p-4 w-72 space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Add a personal note…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c] resize-none"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowNote(false)}
              className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-full border border-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNote}
              disabled={saving}
              className="text-xs font-semibold bg-[#1abc9c] hover:bg-[#15a288] text-white px-3 py-1.5 rounded-full disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
