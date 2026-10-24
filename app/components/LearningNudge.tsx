"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "./Toast";
import { useT } from "../i18n/I18nProvider";

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

export function LearningNudge() {
  const { toast } = useToast();
  const t = useT();
  const shown = useRef(false);

  const check = useCallback(() => {
    if (shown.current) return;
    const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) ?? 0);
    const lastNudge = Number(localStorage.getItem(NUDGE_SHOWN_KEY) ?? 0);
    const now = Date.now();
    const idle = lastActivity > 0 && now - lastActivity > IDLE_THRESHOLD_MS;
    const cooldownOk = now - lastNudge > NUDGE_COOLDOWN_MS;
    if (idle && cooldownOk) {
      const nudges = Object.values(t.learner.nudges);
      const msg = nudges[Math.floor(Math.random() * nudges.length)];
      toast(msg);
      localStorage.setItem(NUDGE_SHOWN_KEY, now.toString());
      shown.current = true;
    }
  }, [toast, t]);

  useEffect(() => {
    const timer = setTimeout(check, 3000);
    return () => clearTimeout(timer);
  }, [check]);

  return null;
}
