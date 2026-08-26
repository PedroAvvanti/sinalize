import Link from "next/link";
import { redirect } from "next/navigation";

import { CancellationDecisionCard } from "@/components/admin/CancellationDecisionCard";
import { AppBackLink } from "@/components/navigation/AppBackLink";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import {
  CANCELLATION_HISTORY_LIMIT,
  cancellationDecisionLabel,
  cancellationRequesterRoleLabel,
  isCancellationScheduledToday,
  resolveCancellationReviewView,
  type CancellationRequesterRole,
} from "@/lib/domain/cancellations";
import { CANCEL_REASONS } from "@/lib/domain/reasons";
import { createClient } from "@/lib/supabase/server";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

type AdminCancellationsPageProps = {
  searchParams: Promise<{ view?: string | string[] }>;
};

export default async function AdminCancellationsPage({
  searchParams,
}: AdminCancellationsPageProps) {
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

  const params = await searchParams;
  const view = resolveCancellationReviewView(params.view);

  const { count: pendingCount } = await supabase
    .from("cancellation_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div
      className="admin-desk admin-desk--nested"
      aria-labelledby="admin-cancellations-title"
    >
      <AppBackLink href="/app/admin" />
      <header className="admin-subhero">
        <div className="admin-subhero__copy">
          <p className="auth-eyebrow">Cancelamentos</p>
          <h1 id="admin-cancellations-title" className="admin-subhero__title">
            {view === "history"
              ? "Histórico de cancelamentos"
              : "Solicitações pendentes"}
          </h1>
          {view === "pending" ? (
            <p className="admin-review-lead">
              Decisões do dia têm prioridade. Aprovar cancelamento de intérprete
              devolve o pedido à fila.
            </p>
          ) : null}
        </div>
        {view === "pending" ? (
          <PendingCountBadge count={pendingCount ?? 0} />
        ) : null}
      </header>

      <nav className="admin-review-tabs" aria-label="Visões de cancelamentos">
        <Link
          className={
            view === "pending"
              ? "admin-review-tab admin-review-tab--active"
              : "admin-review-tab"
          }
          href="/app/admin/cancellations"
          aria-current={view === "pending" ? "page" : undefined}
        >
          Pendentes
          <span className="admin-review-tab__count">{pendingCount ?? 0}</span>
        </Link>
        <Link
          className={
            view === "history"
              ? "admin-review-tab admin-review-tab--active"
              : "admin-review-tab"
          }
          href="/app/admin/cancellations?view=history"
          aria-current={view === "history" ? "page" : undefined}
        >
          Histórico
        </Link>
      </nav>

      {view === "history" ? <HistoryView /> : <PendingView />}
    </div>
  );
}

function PendingCountBadge({ count }: { count: number }) {
  return (
    <p
      className="pending-count"
      aria-label={`${count} ${count === 1 ? "pendente" : "pendentes"}`}
    >
      <strong>{count}</strong>
      <span>{count === 1 ? "pendente" : "pendentes"}</span>
    </p>
  );
}

async function PendingView() {
  const supabase = await createClient();

  const { data: requests, error: requestsError } = await supabase
    .from("cancellation_requests")
    .select(
      "id, appointment_id, requested_by_role, reason_code, reason_text, created_at",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (requestsError) {
    return (
      <p className="admin-review-lead" role="alert">
        Não foi possível carregar a fila. Recarregue a página em alguns
        instantes.
      </p>
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
      <p className="admin-review-lead" role="alert">
        Não foi possível carregar os atendimentos. Recarregue a página em alguns
        instantes.
      </p>
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
    <>
      {urgentCount > 0 ? (
        <p className="admin-review-lead" aria-live="polite">
          {urgentCount}{" "}
          {urgentCount === 1
            ? "solicitação urgente de hoje"
            : "solicitações urgentes de hoje"}
          .
        </p>
      ) : null}

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
    </>
  );
}

async function HistoryView() {
  const supabase = await createClient();

  const { data: decisions, error: decisionsError } = await supabase
    .from("cancellation_requests")
    .select(
      "id, appointment_id, requested_by, requested_by_role, reason_code, reason_text, status, admin_decision_note, reviewed_by, reviewed_at",
    )
    .in("status", ["approved", "rejected"])
    .order("reviewed_at", { ascending: false })
    .limit(CANCELLATION_HISTORY_LIMIT);

  if (decisionsError) {
    return (
      <p className="admin-review-lead" role="alert">
        Não foi possível carregar o histórico. Recarregue a página em alguns
        instantes.
      </p>
    );
  }

  const historyItems = decisions ?? [];
  const appointmentIds = [
    ...new Set(historyItems.map((item) => item.appointment_id)),
  ];
  const profileIds = [
    ...new Set(
      historyItems.flatMap((item) =>
        [item.requested_by, item.reviewed_by].filter(
          (id): id is string => Boolean(id),
        ),
      ),
    ),
  ];

  const [{ data: appointments, error: appointmentsError }, { data: people, error: peopleError }] =
    await Promise.all([
      appointmentIds.length > 0
        ? supabase
            .from("appointments")
            .select("id, scheduled_at")
            .in("id", appointmentIds)
        : Promise.resolve({ data: [], error: null }),
      profileIds.length > 0
        ? supabase.from("profiles").select("id, full_name").in("id", profileIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (appointmentsError) {
    return (
      <p className="admin-review-lead" role="alert">
        Não foi possível carregar os atendimentos do histórico. Recarregue a
        página.
      </p>
    );
  }

  if (peopleError) {
    return (
      <p className="admin-review-lead" role="alert">
        Não foi possível identificar os nomes do histórico. Recarregue a página.
      </p>
    );
  }

  const scheduledById = new Map(
    (appointments ?? []).map(({ id, scheduled_at }) => [id, scheduled_at]),
  );
  const namesById = new Map(
    (people ?? []).map(({ id, full_name }) => [
      id,
      full_name.trim() || "Nome não informado",
    ]),
  );

  return (
    <>
      <p className="admin-review-lead">
        Decisões já tomadas sobre cancelamentos. Mostra as{" "}
        {CANCELLATION_HISTORY_LIMIT} mais recentes.
      </p>

      {historyItems.length > 0 ? (
        <ul className="admin-application-history">
          {historyItems
            .filter(
              (
                item,
              ): item is typeof item & {
                status: "approved" | "rejected";
                reviewed_at: string;
                requested_by_role: CancellationRequesterRole;
              } =>
                (item.status === "approved" || item.status === "rejected") &&
                Boolean(item.reviewed_at) &&
                (item.requested_by_role === "user" ||
                  item.requested_by_role === "interpreter"),
            )
            .map((item) => {
              const cancelReason =
                CANCEL_REASONS.find(
                  (option) => option.value === item.reason_code,
                )?.label ?? "Motivo informado";
              const scheduledAt = scheduledById.get(item.appointment_id);
              const requesterName =
                namesById.get(item.requested_by) ?? "Solicitante";

              return (
                <li
                  key={item.id}
                  className={`admin-application-history__item admin-application-history__item--${item.status}`}
                >
                  <div className="admin-application-history__main">
                    <p className="admin-application-history__name">
                      {cancellationRequesterRoleLabel(item.requested_by_role)}{" "}
                      — {requesterName}
                    </p>
                    <time dateTime={item.reviewed_at}>
                      Decisão:{" "}
                      {dateFormatter.format(new Date(item.reviewed_at))}
                    </time>
                    {scheduledAt ? (
                      <p className="admin-application-history__meta">
                        Atendimento:{" "}
                        {dateFormatter.format(new Date(scheduledAt))}
                      </p>
                    ) : null}
                    <p className="admin-application-history__meta">
                      Motivo: {cancelReason}
                      {item.reason_text ? ` — ${item.reason_text}` : ""}
                    </p>
                    <p className="admin-application-history__meta">
                      Revisado por{" "}
                      {item.reviewed_by
                        ? (namesById.get(item.reviewed_by) ?? "admin")
                        : "admin"}
                    </p>
                    {item.admin_decision_note ? (
                      <p className="admin-application-history__reason">
                        Nota: {item.admin_decision_note}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`request-status-badge request-status-badge-${item.status}`}
                  >
                    {cancellationDecisionLabel(item.status)}
                  </span>
                </li>
              );
            })}
        </ul>
      ) : (
        <div className="admin-review-empty">
          <span className="status-signal" aria-hidden="true" />
          <div>
            <h2>Sem histórico</h2>
            <p>Nenhuma decisão registrada ainda.</p>
          </div>
        </div>
      )}
    </>
  );
}
