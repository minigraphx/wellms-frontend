"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "./Toast";

const LAST_ACTIVITY_KEY = "nudge_last_activity";
const NUDGE_SHOWN_KEY = "nudge_last_shown";
// Show a nudge if idle for more than 24h and haven't been nudged in 4h
const IDLE_THRESHOLD_MS = 24 * 60 * 60 * 1000;
const NUDGE_COOLDOWN_MS = 4 * 60 * 60 * 1000;

export function recordLearningActivity() {
  if (typeof window !== "undefined") {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }
}

const NUDGES = [
  "Du hast länger nicht gelernt — wie wäre es mit einer kurzen Lektion?",
  "Regelmäßiges Lernen macht den Unterschied. Bereit für heute?",
  "Deine Flashcards warten auf dich! Zeit für eine kurze Wiederholung.",
  "Kleine Lerneinheiten jeden Tag führen zu großen Ergebnissen.",
];

export function LearningNudge() {
  const { toast } = useToast();
  const shown = useRef(false);

  const check = useCallback(() => {
    if (shown.current) return;
    const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) ?? 0);
    const lastNudge = Number(localStorage.getItem(NUDGE_SHOWN_KEY) ?? 0);
    const now = Date.now();
    const idle = lastActivity > 0 && now - lastActivity > IDLE_THRESHOLD_MS;
    const cooldownOk = now - lastNudge > NUDGE_COOLDOWN_MS;
    if (idle && cooldownOk) {
      const msg = NUDGES[Math.floor(Math.random() * NUDGES.length)];
      toast(msg);
      localStorage.setItem(NUDGE_SHOWN_KEY, now.toString());
      shown.current = true;
    }
  }, [toast]);

  useEffect(() => {
    const t = setTimeout(check, 3000);
    return () => clearTimeout(t);
  }, [check]);

  return null;
}
