import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type NotificationInsert =
  Database["public"]["Tables"]["notifications"]["Insert"];

export async function insertNotifications(
  notifications: NotificationInsert[],
): Promise<void> {
  if (notifications.length === 0) {
    return;
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert(notifications);

    if (error) {
      console.error("Não foi possível inserir notificações.", {
        code: error.code,
        count: notifications.length,
      });
    }
  } catch {
    console.error("Cliente de notificações indisponível.");
  }
}

export async function notifyAdmins(
  notification: Omit<NotificationInsert, "profile_id">,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: admins, error } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (error || !admins?.length) {
      console.error("Não foi possível localizar administradores.", {
        code: error?.code,
      });
      return;
    }

    await insertNotifications(
      admins.map((adminProfile) => ({
        ...notification,
        profile_id: adminProfile.id,
      })),
    );
  } catch {
    console.error("Cliente de notificações indisponível para admins.");
  }
}
