import Link from "next/link";
import { redirect } from "next/navigation";

import { AppointmentHistoryList } from "@/components/appointments/AppointmentHistoryList";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { createClient } from "@/lib/supabase/server";

const HISTORY_STATUSES = ["completed", "cancelled", "expired"] as const;

export default async function UserHistoryPage() {
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

  if (profile.role !== "user") {
    redirect(`/app/${profile.role}`);
  }

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("id, status, scheduled_at, duration_minutes, reason_code")
    .eq("requester_id", userId)
    .in("status", HISTORY_STATUSES)
    .order("scheduled_at", { ascending: false })
    .limit(50);

  return (
    <section className="app-panel history-page" aria-labelledby="history-title">
      <header className="history-page__header">
        <p className="auth-eyebrow">Histórico</p>
        <h1 id="history-title">Atendimentos anteriores</h1>
        <p className="history-page__lead">
          Consulte atendimentos concluídos, cancelados ou expirados.
        </p>
      </header>

      {appointmentsError ? (
        <p className="user-dashboard-error" role="alert">
          Não foi possível carregar o histórico. Recarregue a página.
        </p>
      ) : (
        <AppointmentHistoryList
          appointments={appointments ?? []}
          showReviewLink
        />
      )}

      <Link className="next-call-secondary" href="/app/user">
        Voltar ao início
      </Link>
    </section>
  );
}
