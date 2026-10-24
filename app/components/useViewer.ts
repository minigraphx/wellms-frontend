"use client";

import { useContext, useSyncExternalStore } from "react";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";

export type Viewer = "pending" | "guest" | "member";

const subscribe = () => () => {};

// Who is looking at the page. With a stored token the profile loads after mount, so that
// state is "pending" rather than "guest", to avoid flashing the guest view to members.
export function useViewer(): Viewer {
  const { token, user } = useContext(EscolaLMSContext);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!mounted) return "pending";
  if (user.value) return "member";
  // A stored token whose profile failed to load means signed out.
  if (!token || user.error) return "guest";
  return "pending";
}
