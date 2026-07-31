"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  relatedAppointmentId: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function listNotifications(): Promise<{
  notifications: NotificationItem[];
  unreadCount: number;
}> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return { notifications: [], unreadCount: 0 };
  }

  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, type, title, body, related_appointment_id, read_at, created_at",
    )
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return { notifications: [], unreadCount: 0 };
  }

  const notifications = data.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    relatedAppointmentId: item.related_appointment_id,
    readAt: item.read_at,
    createdAt: item.created_at,
  }));

  return {
    notifications,
    unreadCount: notifications.filter((item) => !item.readAt).length,
  };
}

export async function markNotificationReadAction(
  notificationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!notificationId) {
    return { ok: false, error: "Notificação inválida." };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return {
      ok: false,
      error: "Sua sessão expirou. Entre novamente para continuar.",
    };
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("profile_id", userId)
    .is("read_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      error: "Não foi possível marcar a notificação como lida.",
    };
  }

  revalidatePath("/app/notifications");
  return { ok: true };
}
