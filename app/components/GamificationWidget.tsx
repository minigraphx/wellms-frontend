"use client";

import { useEffect, useState } from "react";

const POINTS_KEY = "gamification_points_v1";
const BADGES_KEY = "gamification_badges_v1";

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  threshold: number; // lessons completed to earn
}

const BADGE_DEFINITIONS: Badge[] = [
  { id: "first_step", name: "First Step", icon: "🌱", description: "Complete your first lesson", threshold: 1 },
  { id: "getting_started", name: "Getting Started", icon: "🚀", description: "Complete 5 lessons", threshold: 5 },
  { id: "committed", name: "Committed", icon: "🔥", description: "Complete 10 lessons", threshold: 10 },
  { id: "scholar", name: "Scholar", icon: "📚", description: "Complete 25 lessons", threshold: 25 },
  { id: "expert", name: "Expert", icon: "🏆", description: "Complete 50 lessons", threshold: 50 },
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
  return { newBadges };
}

export function GamificationWidget() {
  const [state, setState] = useState<GamificationState>({ points: 0, lessonsCompleted: 0, badges: [] });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setState(loadGamification());
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
        <h2 className="font-semibold text-[#04323e] text-sm">Your Progress</h2>
        <span className="text-xs font-bold text-[#1abc9c]">{state.points} XP</span>
      </div>

      <p className="text-xs text-gray-400 mb-2">{state.lessonsCompleted} lessons completed</p>

      {nextBadge && (
        <>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
            <div
              className="h-1.5 rounded-full bg-[#1abc9c] transition-all"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mb-3">
            {nextBadge.icon} {state.lessonsCompleted}/{nextBadge.threshold} lessons to earn "{nextBadge.name}"
          </p>
        </>
      )}

      {earnedBadges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {earnedBadges.map((b) => (
            <span
              key={b.id}
              title={b.description}
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
