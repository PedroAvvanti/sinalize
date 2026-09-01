"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type MouseEvent } from "react";

import {
  markNotificationReadAction,
  type NotificationItem,
} from "@/actions/notifications";
import { resolveNotificationHref } from "@/lib/domain/notifications";

type NotificationsListProps = {
  notifications: NotificationItem[];
  role: "user" | "interpreter" | "admin";
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function NotificationsList({
  notifications,
  role,
}: NotificationsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function markRead(notificationId: string, event?: MouseEvent) {
    event?.stopPropagation();
    event?.preventDefault();
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
      {notifications.map((notification) => {
        const href = resolveNotificationHref(
          notification.type,
          notification.relatedAppointmentId,
          role,
        );

        const content = (
          <>
            <h2>{notification.title}</h2>
            <p>{notification.body}</p>
            <time dateTime={notification.createdAt}>
              {dateFormatter.format(new Date(notification.createdAt))}
            </time>
            {href ? (
              <span className="notification-item__cta">
                Ver detalhes <span aria-hidden="true">→</span>
              </span>
            ) : null}
          </>
        );

        return (
          <li
            key={notification.id}
            className={
              notification.readAt
                ? "notification-item notification-item-read"
                : "notification-item"
            }
          >
            {href ? (
              <Link
                className="notification-item__main"
                href={href}
                aria-label={`${notification.title}. ${notification.body}`}
              >
                {content}
              </Link>
            ) : (
              <div className="notification-item__main">{content}</div>
            )}

            {!notification.readAt ? (
              <button
                className="notification-mark-read"
                type="button"
                disabled={isPending}
                onClick={(event) => markRead(notification.id, event)}
              >
                Marcar como lida
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
