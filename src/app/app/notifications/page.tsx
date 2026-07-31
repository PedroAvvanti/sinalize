import { redirect } from "next/navigation";

import { listNotifications } from "@/actions/notifications";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    redirect(profileUnavailableLoginPath());
  }

  const { notifications } = await listNotifications();

  return (
    <section className="app-panel notifications-page" aria-labelledby="notifications-title">
      <p className="auth-eyebrow">Atualizações</p>
      <h1 id="notifications-title">Notificações</h1>
      <p className="notifications-lead">
        Avisos sobre candidaturas, atendimentos e cancelamentos ficam aqui.
      </p>
      <NotificationsList notifications={notifications} />
    </section>
  );
}
