"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  markNotificationReadAction,
  type NotificationItem,
} from "@/actions/notifications";

type NotificationsListProps = {
  notifications: NotificationItem[];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function NotificationsList({ notifications }: NotificationsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function markRead(notificationId: string) {
    startTransition(async () => {
      await markNotificationReadAction(notificationId);
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return (
      <div className="notifications-empty" role="status">
        <span aria-hidden="true">🔔</span>
        <h2>Nenhuma notificação</h2>
        <p>Atualizações importantes aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <ul className="notifications-list">
      {notifications.map((notification) => (
        <li
          key={notification.id}
          className={
            notification.readAt
              ? "notification-item notification-item-read"
              : "notification-item"
          }
        >
          <div>
            <h2>{notification.title}</h2>
            <p>{notification.body}</p>
            <time dateTime={notification.createdAt}>
              {dateFormatter.format(new Date(notification.createdAt))}
            </time>
          </div>
          {!notification.readAt ? (
            <button
              className="notification-mark-read"
              type="button"
              disabled={isPending}
              onClick={() => markRead(notification.id)}
            >
              Marcar como lida
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
