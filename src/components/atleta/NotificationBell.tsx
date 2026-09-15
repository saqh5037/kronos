"use client";

import { useEffect, useState, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  CalendarDays,
  CreditCard,
  Dumbbell,
  Flame,
  Megaphone,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import {
  listMyNotifications,
  markAllRead,
  markRead,
  countUnreadNotifications,
} from "@/server/actions/notifications";
import type { NotificationRow } from "@/server/actions/notifications";

const POLL_INTERVAL_MS = 60_000;

/**
 * Icon per notification kind.
 *
 * Was an emoji map (🏋️ 🔥 📅 💳 📢 ⚠️): screen readers announced
 * "weight lifter", "fire", "calendar" as content (audit 2026-09-15 §B).
 * `lucide-react` icons are decorative (`aria-hidden`) and the title carries
 * the meaning.
 */
const KIND_ICONS: Record<string, LucideIcon> = {
  SCORE_REGISTERED: Dumbbell,
  PR_NEW: Flame,
  BOOKING_REMINDER: CalendarDays,
  PAYMENT_DUE: CreditCard,
  ANNOUNCEMENT: Megaphone,
  ALERT: TriangleAlert,
};

function KindIcon({ kind }: { kind: NotificationRow["kind"] }) {
  const Icon = KIND_ICONS[kind] ?? Bell;
  return <Icon size={16} aria-hidden />;
}

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const prevUnread = useRef(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Poll unread count every 60s
  useEffect(() => {
    let mounted = true;

    async function fetchCount() {
      try {
        const count = await countUnreadNotifications();
        if (mounted) {
          if (count > prevUnread.current && prevUnread.current > 0) {
            setShake(true);
            setTimeout(() => setShake(false), 600);
          }
          prevUnread.current = count;
          setUnread(count);
        }
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
      const count = await countUnreadNotifications();
      setUnread(count);
      prevUnread.current = count;
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAll() {
    await markAllRead();
    setUnread(0);
    prevUnread.current = 0;
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
  }

  async function handleRead(id: string) {
    await markRead([id]);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n)),
    );
    setUnread((prev) => Math.max(0, prev - 1));
    prevUnread.current = Math.max(0, prevUnread.current - 1);
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 },
    },
  };

  const itemAnim = {
    hidden: { opacity: 0, x: -8 },
    show: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  // The badge itself is aria-hidden: the count travels in the button's label
  // so a screen reader announces "3 notificaciones sin leer" instead of "3".
  const bellLabel =
    unread === 0
      ? "Notificaciones"
      : unread === 1
        ? "1 notificación sin leer"
        : `${unread} notificaciones sin leer`;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell button — 44x44 minimum touch target (WCAG 2.5.5). */}
      <m.button
        onClick={handleOpen}
        aria-label={bellLabel}
        aria-expanded={open}
        className="relative flex items-center justify-center rounded-full text-[var(--k-t2)] hover:text-[var(--k-t1)] hover:bg-[var(--k-elevated)] transition-colors"
        style={{ width: 44, height: 44 }}
        animate={shake ? { rotate: [0, -12, 10, -8, 6, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <Bell size={20} aria-hidden />

        <AnimatePresence>
          {unread > 0 && (
            <m.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              aria-hidden
              className="absolute min-w-[16px] h-4 px-1 rounded-full bg-[var(--k-accent)] text-[var(--k-accent-on)] text-[10px] font-bold flex items-center justify-center"
              style={{ top: 6, right: 6 }}
            >
              <span className="relative flex h-full w-full items-center justify-center">
                {unread > 9 ? "9+" : unread}
                <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--k-accent)] opacity-75 animate-ping" />
              </span>
            </m.span>
          )}
        </AnimatePresence>
      </m.button>

      {/* Popover */}
      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-12 w-80 bg-[var(--k-surface)]/95 backdrop-blur-xl border border-[var(--k-line)] rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--k-line)]">
              <span className="text-sm font-semibold text-[var(--k-t1)]">
                Notificaciones
              </span>
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs text-[var(--k-t2)] hover:text-[var(--k-accent)] transition-colors"
                  style={{ minHeight: 44, paddingInline: 4 }}
                >
                  Marcar todo leído
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--k-elevated)] shrink-0 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-[var(--k-elevated)] rounded w-3/4 animate-pulse" />
                        <div className="h-2 bg-[var(--k-elevated)] rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellOff
                    size={28}
                    aria-hidden
                    className="mx-auto mb-2 text-[var(--k-t3)]"
                  />
                  <p className="text-sm text-[var(--k-t2)]">
                    Sin notificaciones nuevas
                  </p>
                  <p className="text-xs text-[var(--k-t3)] mt-1">
                    Te avisamos cuando haya algo importante
                  </p>
                </div>
              ) : (
                <m.div variants={container} initial="hidden" animate="show">
                  {notifications.map((n) => (
                    <m.div
                      key={n.id}
                      variants={itemAnim}
                      onClick={() => !n.readAt && handleRead(n.id)}
                      className={`flex gap-3 px-4 py-3 border-b border-[var(--k-line)] last:border-0 cursor-pointer hover:bg-[var(--k-elevated)] transition-colors ${
                        !n.readAt ? "bg-[var(--k-elevated)]" : ""
                      }`}
                    >
                      <span className="mt-0.5 shrink-0 text-[var(--k-t2)]">
                        <KindIcon kind={n.kind} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm leading-snug ${
                            !n.readAt
                              ? "text-[var(--k-t1)] font-medium"
                              : "text-[var(--k-t2)]"
                          }`}
                        >
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-xs text-[var(--k-t3)] mt-0.5 truncate">
                            {n.body}
                          </p>
                        )}
                        <p className="text-xs text-[var(--k-t3)] mt-1 font-mono">
                          {n.createdAt.toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {!n.readAt && (
                        <span
                          aria-hidden
                          className="w-2 h-2 rounded-full bg-[var(--k-accent)] mt-1.5 flex-shrink-0"
                        />
                      )}
                    </m.div>
                  ))}
                </m.div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
