"use client";

import { useEffect, useState, useRef } from "react";
import {
  listMyNotifications,
  markAllRead,
  markRead,
  countUnreadNotifications,
} from "@/server/actions/notifications";
import type { NotificationRow } from "@/server/actions/notifications";

const POLL_INTERVAL_MS = 60_000; // 60s

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Poll unread count every 60s
  useEffect(() => {
    let mounted = true;

    async function fetchCount() {
      try {
        const count = await countUnreadNotifications();
        if (mounted) setUnread(count);
      } catch {
        // best-effort
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close popover on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  async function handleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    try {
      const notifs = await listMyNotifications({ limit: 10 });
      setNotifications(notifs);
      // Refresh unread count
      const count = await countUnreadNotifications();
      setUnread(count);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAll() {
    await markAllRead();
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
  }

  async function handleRead(id: string) {
    await markRead([id]);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n)),
    );
    setUnread((prev) => Math.max(0, prev - 1));
  }

  function kindIcon(kind: NotificationRow["kind"]): string {
    const icons: Record<string, string> = {
      SCORE_REGISTERED: "🏋️",
      PR_NEW: "🔥",
      BOOKING_REMINDER: "📅",
      PAYMENT_DUE: "💳",
      ANNOUNCEMENT: "📢",
      ALERT: "⚠️",
    };
    return icons[kind] ?? "🔔";
  }

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label="Notificaciones"
        className="relative p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[--pr] text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-[--card] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold text-white">
              Notificaciones
            </span>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-[--strain] hover:underline"
              >
                Marcar todo leído
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-white/40 text-sm">
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-white/40 text-sm">
                Sin notificaciones
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.readAt && handleRead(n.id)}
                  className={`flex gap-3 px-4 py-3 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 transition-colors ${
                    !n.readAt ? "bg-[--strain]/5" : ""
                  }`}
                >
                  <span className="text-lg mt-0.5">{kindIcon(n.kind)}</span>
                  <div className="min-w-0">
                    <p
                      className={`text-sm leading-snug ${!n.readAt ? "text-white font-medium" : "text-white/70"}`}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-white/40 mt-0.5 truncate">
                        {n.body}
                      </p>
                    )}
                    <p className="text-xs text-white/30 mt-1">
                      {n.createdAt.toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!n.readAt && (
                    <span className="w-2 h-2 rounded-full bg-[--strain] mt-1.5 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
