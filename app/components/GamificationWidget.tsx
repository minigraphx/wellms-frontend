"use client";

import { useEffect, useState } from "react";
import { useFormat, useT } from "../i18n/I18nProvider";
import type { Messages } from "../i18n/messages";

const POINTS_KEY = "gamification_points_v1";

// Badge names and descriptions live in the learner messages (gamification.badges), keyed by id.
type BadgeId = keyof Messages["learner"]["gamification"]["badges"];

interface Badge {
  id: BadgeId;
  icon: string;
  threshold: number; // lessons completed to earn
}

const BADGE_DEFINITIONS: Badge[] = [
  { id: "first_step", icon: "🌱", threshold: 1 },
  { id: "getting_started", icon: "🚀", threshold: 5 },
  { id: "committed", icon: "🔥", threshold: 10 },
  { id: "scholar", icon: "📚", threshold: 25 },
  { id: "expert", icon: "🏆", threshold: 50 },
];

const POINTS_PER_LESSON = 10;

export interface GamificationState {
  points: number;
  lessonsCompleted: number;
  badges: string[];
}

export function loadGamification(): GamificationState {
  try {
    const raw = localStorage.getItem(POINTS_KEY);
    return raw ? JSON.parse(raw) : { points: 0, lessonsCompleted: 0, badges: [] };
  } catch { return { points: 0, lessonsCompleted: 0, badges: [] }; }
}

export function awardPoints(extra = 0): { newBadges: Badge[] } {
  const state = loadGamification();
  const newLessons = state.lessonsCompleted + 1;
  const newPoints = state.points + POINTS_PER_LESSON + extra;
  const prevBadges = new Set(state.badges);
  const newBadges = BADGE_DEFINITIONS.filter(
    (b) => newLessons >= b.threshold && !prevBadges.has(b.id)
  );
  const updatedBadges = [...state.badges, ...newBadges.map((b) => b.id)];
  const updated: GamificationState = { points: newPoints, lessonsCompleted: newLessons, badges: updatedBadges };
  localStorage.setItem(POINTS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("gamification-update"));
  return { newBadges };
}

export function GamificationWidget() {
  const [state, setState] = useState<GamificationState>({ points: 0, lessonsCompleted: 0, badges: [] });
  const [mounted, setMounted] = useState(false);
  const t = useT();
  const { number } = useFormat();
  const g = t.learner.gamification;

  useEffect(() => {
    setMounted(true);
    setState(loadGamification());
    const refresh = () => setState(loadGamification());
    window.addEventListener("gamification-update", refresh);
    return () => window.removeEventListener("gamification-update", refresh);
  }, []);

  if (!mounted) return null;

  const earnedBadges = BADGE_DEFINITIONS.filter((b) => state.badges.includes(b.id));
  const nextBadge = BADGE_DEFINITIONS.find((b) => !state.badges.includes(b.id));
  const progressToNext = nextBadge
    ? Math.min(100, Math.round((state.lessonsCompleted / nextBadge.threshold) * 100))
    : 100;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-[#04323e] text-sm">{g.yourProgress}</h2>
        <span className="text-xs font-bold text-[#1abc9c]">{g.points(number(state.points))}</span>
      </div>

      <p className="text-xs text-gray-400 mb-2">{g.lessonsCompleted(state.lessonsCompleted)}</p>

      {nextBadge && (
        <>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
            <div
              className="h-1.5 rounded-full bg-[#1abc9c] transition-all"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mb-3">
            {nextBadge.icon} {g.toNextBadge(state.lessonsCompleted, nextBadge.threshold, g.badges[nextBadge.id].name)}
          </p>
        </>
      )}

      {earnedBadges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {earnedBadges.map((b) => (
            <span
              key={b.id}
              title={g.badges[b.id].description}
              className="text-lg cursor-default"
            >
              {b.icon}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
