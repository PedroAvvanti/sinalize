"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type NotificationBellProps = {
  userId: string;
  initialUnread: number;
};

export function NotificationBell({
  userId,
  initialUnread,
}: NotificationBellProps) {
  const [supabase] = useState(createClient);
  const [unreadCount, setUnreadCount] = useState(initialUnread);

  useEffect(() => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${userId}`,
        },
        () => {
          setUnreadCount((current) => current + 1);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${userId}`,
        },
        async () => {
          const { count } = await supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("profile_id", userId)
            .is("read_at", null);

          setUnreadCount(count ?? 0);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  return (
    <Link
      className="notification-bell"
      href="/app/notifications"
      aria-label={
        unreadCount > 0
          ? `${unreadCount} notificações não lidas`
          : "Notificações"
      }
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 ? (
        <span className="notification-bell__badge">{unreadCount}</span>
      ) : null}
    </Link>
  );
}
