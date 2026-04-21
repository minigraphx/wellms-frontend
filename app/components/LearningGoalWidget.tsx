"use client";

import { useEffect, useState } from "react";

const GOAL_KEY = "lernziel_goal";
const WEEK_KEY = "lernziel_week";
const COUNT_KEY = "lernziel_count";

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const year = d.getUTCFullYear();
  const week = Math.ceil(((d.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function recordLessonCompletion() {
  if (typeof window === "undefined") return;
  const week = isoWeek(new Date());
  const stored = localStorage.getItem(WEEK_KEY);
  const count = stored === week ? Number(localStorage.getItem(COUNT_KEY) ?? 0) : 0;
  localStorage.setItem(WEEK_KEY, week);
  localStorage.setItem(COUNT_KEY, String(count + 1));
}

export function LearningGoalWidget() {
  const [goal, setGoal] = useState(5);
  const [count, setCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("5");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedGoal = Number(localStorage.getItem(GOAL_KEY) ?? 5);
    setGoal(storedGoal);
    setDraft(String(storedGoal));

    const week = isoWeek(new Date());
    const storedWeek = localStorage.getItem(WEEK_KEY);
    const storedCount = storedWeek === week ? Number(localStorage.getItem(COUNT_KEY) ?? 0) : 0;
    setCount(storedCount);
  }, []);

  if (!mounted) return null;

  const pct = Math.min(100, Math.round((count / goal) * 100));
  const done = count >= goal;

  function saveGoal() {
    const n = Math.max(1, Math.min(99, Number(draft) || goal));
    setGoal(n);
    setDraft(String(n));
    localStorage.setItem(GOAL_KEY, String(n));
    setEditing(false);
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-[#04323e] text-sm">Wochenziel</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-gray-400 hover:text-[#1abc9c] transition-colors"
          >
            Anpassen
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="number"
            min={1}
            max={99}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveGoal()}
            className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-[#1abc9c]"
            autoFocus
          />
          <span className="text-sm text-gray-500">Lektionen / Woche</span>
          <button
            onClick={saveGoal}
            className="ml-auto text-xs bg-[#1abc9c] text-white px-3 py-1 rounded-full hover:bg-[#15a288] transition-colors"
          >
            Speichern
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-3">
          {done ? "Ziel erreicht! 🎉" : `${count} von ${goal} Lektionen diese Woche`}
        </p>
      )}

      <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
        <div
          className={`h-2 rounded-full transition-all ${done ? "bg-[#1abc9c]" : "bg-[#1abc9c]/60"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 text-right">{pct}%</p>
    </div>
  );
}
