"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import type { API } from "@escolalms/sdk/lib";

type SDKNotification = {
  id: string;
  read_at: null | Date | string;
  created_at: Date | string;
  event: string;
  data: {
    course?: { title?: string };
    order?: { id?: number };
    notification?: { sections?: { key: string; value: string }[] };
  };
};

function notificationLabel(n: SDKNotification): string {
  if (n.data?.course?.title) return `Course update: ${n.data.course.title}`;
  if (n.data?.order?.id) return `Order #${n.data.order.id} update`;
  const msg = n.data?.notification?.sections?.find((s) => s.key === "message")?.value;
  if (msg) return msg;
  return n.event?.split("\\").pop() ?? "New notification";
}

export function NotificationBell() {
  const ctx = useContext(EscolaLMSContext) as any;
  const { user, fetchNotifications, readNotify, readAllNotifications, notifications } = ctx;

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.value) return;
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(iv);
  }, [user?.value]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const items: SDKNotification[] = useMemo(() => {
    const raw = notifications?.value?.data ?? notifications?.value ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [notifications]);

  const unread = items.filter((n) => !n.read_at).length;

  if (!user?.value) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        className="relative text-[#555555] hover:text-[#1abc9c] transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-semibold text-[#04323e]">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() => readAllNotifications()}
                className="text-xs text-[#1abc9c] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {items.length === 0 && (
              <li className="px-4 py-6 text-sm text-gray-400 text-center">No notifications</li>
            )}
            {items.slice(0, 20).map((n) => (
              <li
                key={n.id}
                onClick={() => { if (!n.read_at) readNotify(n.id); }}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read_at ? "bg-[#1abc9c]/5" : ""}`}
              >
                <p className="text-sm text-[#04323e] leading-snug">{notificationLabel(n)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(n.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
