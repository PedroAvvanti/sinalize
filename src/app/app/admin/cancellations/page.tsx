import { redirect } from "next/navigation";

import { CancellationDecisionCard } from "@/components/admin/CancellationDecisionCard";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { isCancellationScheduledToday } from "@/lib/domain/cancellations";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCancellationsPage() {
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

  if (profile.role !== "admin") {
    redirect(`/app/${profile.role}`);
  }

  const { data: requests, error: requestsError } = await supabase
    .from("cancellation_requests")
    .select(
      "id, appointment_id, requested_by_role, reason_code, reason_text, created_at",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (requestsError) {
    return (
      <section
        className="app-panel admin-review-page"
        aria-labelledby="admin-cancellations-title"
      >
        <p className="auth-eyebrow">Cancelamentos</p>
        <h1 id="admin-cancellations-title">Não foi possível carregar a fila</h1>
        <p className="admin-review-lead" role="alert">
          Recarregue a página em alguns instantes.
        </p>
      </section>
    );
  }

  const pendingRequests = requests ?? [];
  const appointmentIds = pendingRequests.map(
    (request) => request.appointment_id,
  );

  const { data: appointments, error: appointmentsError } =
    appointmentIds.length > 0
      ? await supabase
          .from("appointments")
          .select("id, scheduled_at, duration_minutes, reason_code, status")
          .in("id", appointmentIds)
          .eq("status", "cancel_requested")
      : { data: [], error: null };

  if (appointmentsError) {
    return (
      <section
        className="app-panel admin-review-page"
        aria-labelledby="admin-cancellations-title"
      >
        <p className="auth-eyebrow">Cancelamentos</p>
        <h1 id="admin-cancellations-title">
          Não foi possível carregar os atendimentos
        </h1>
        <p className="admin-review-lead" role="alert">
          Recarregue a página em alguns instantes.
        </p>
      </section>
    );
  }

  const appointmentsById = new Map(
    (appointments ?? []).map((appointment) => [appointment.id, appointment]),
  );

  const now = new Date();
  const cards = pendingRequests
    .map((request) => {
      const appointment = appointmentsById.get(request.appointment_id);
      if (!appointment) {
        return null;
      }

      return {
        id: request.id,
        requestedByRole: request.requested_by_role,
        reasonCode: request.reason_code,
        reasonText: request.reason_text,
        submittedAt: request.created_at,
        scheduledAt: appointment.scheduled_at,
        durationMinutes: appointment.duration_minutes,
        appointmentReasonCode: appointment.reason_code,
        urgent: isCancellationScheduledToday(
          new Date(appointment.scheduled_at),
          now,
        ),
      };
    })
    .filter((card): card is NonNullable<typeof card> => card !== null);

  const urgentCount = cards.filter((card) => card.urgent).length;

  return (
    <section
      className="app-panel admin-review-page"
      aria-labelledby="admin-cancellations-title"
    >
      <header className="admin-review-header">
        <div>
          <p className="auth-eyebrow">Cancelamentos</p>
          <h1 id="admin-cancellations-title">Solicitações pendentes</h1>
          <p className="admin-review-lead">
            Decisões do dia têm prioridade. Aprovar cancelamento de intérprete
            devolve o pedido à fila.
          </p>
        </div>
        <p
          className="pending-count"
          aria-label={`${cards.length} pendentes, ${urgentCount} urgentes hoje`}
        >
          <strong>{cards.length}</strong>
          <span>{cards.length === 1 ? "pendente" : "pendentes"}</span>
          {urgentCount > 0 ? (
            <em className="pending-count-urgent">{urgentCount} hoje</em>
          ) : null}
        </p>
      </header>

      {cards.length > 0 ? (
        <div className="interpreter-review-list">
          {cards.map((request) => (
            <CancellationDecisionCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="admin-review-empty">
          <span className="status-signal" aria-hidden="true" />
          <div>
            <h2>Fila em dia</h2>
            <p>Não há cancelamentos aguardando decisão.</p>
          </div>
        </div>
      )}
    </section>
  );
}
