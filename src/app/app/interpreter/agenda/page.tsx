import Link from "next/link";
import { redirect } from "next/navigation";

import { expireStaleAppointments } from "@/actions/appointments";
import { APPOINTMENT_REASONS } from "@/lib/domain/reasons";
import { isUpcomingAppointment } from "@/lib/domain/meeting-access";
import { createClient } from "@/lib/supabase/server";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
  timeStyle: "short",
});

export default async function InterpreterAgendaPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    redirect("/login");
  }

  const [
    { data: profile, error: profileError },
    { data: application, error: applicationError },
  ] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).single(),
    supabase
      .from("interpreter_applications")
      .select("status")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (
    profileError ||
    profile?.role !== "interpreter" ||
    applicationError ||
    application?.status !== "approved"
  ) {
    redirect("/app/interpreter/onboarding");
  }

  await expireStaleAppointments();

  const now = new Date();
  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select(
      "id, status, scheduled_at, duration_minutes, reason_code, reason_text, requester_id",
    )
    .eq("interpreter_id", userId)
    .in("status", ["accepted", "cancel_requested"])
    .order("scheduled_at", { ascending: true });

  const requesterIds = [
    ...new Set((appointments ?? []).map((appointment) => appointment.requester_id)),
  ];

  const { data: requesters } =
    requesterIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", requesterIds)
      : { data: [] as { id: string; full_name: string }[] };

  const requesterNames = new Map(
    (requesters ?? []).map((requester) => [requester.id, requester.full_name]),
  );

  return (
    <section className="app-panel agenda-page" aria-labelledby="agenda-title">
      <header className="agenda-page__header">
        <p className="auth-eyebrow">Agenda</p>
        <h1 id="agenda-title">Atendimentos confirmados</h1>
        <p className="agenda-page__lead">
          Veja os atendimentos aceitos e entre na sala no horário.
        </p>
      </header>

      {appointmentsError ? (
        <p className="user-dashboard-error" role="alert">
          Não foi possível carregar a agenda. Recarregue a página.
        </p>
      ) : appointments?.length ? (
        <ul className="agenda-list">
          {appointments.map((appointment) => {
            const scheduledAt = new Date(appointment.scheduled_at);
            const reason =
              APPOINTMENT_REASONS.find(
                (option) => option.value === appointment.reason_code,
              )?.label ?? "Atendimento";
            const canEnter =
              appointment.status === "accepted" &&
              isUpcomingAppointment(
                scheduledAt,
                appointment.duration_minutes,
                now,
              );
            const requesterName =
              requesterNames.get(appointment.requester_id)?.trim() ||
              "Usuário";

            return (
              <li key={appointment.id} className="agenda-list__item">
                <div>
                  <p className="agenda-list__requester">{requesterName}</p>
                  <p className="agenda-list__reason">{reason}</p>
                  <time dateTime={appointment.scheduled_at}>
                    {dateFormatter.format(scheduledAt)}
                  </time>
                  <p className="agenda-list__duration">
                    {appointment.duration_minutes} minutos
                  </p>
                  {appointment.status === "cancel_requested" ? (
                    <span className="request-status-badge request-status-badge-cancel_requested">
                      Cancelamento em análise
                    </span>
                  ) : null}
                </div>
                {canEnter ? (
                  <Link
                    className="user-request-link"
                    href={`/app/meeting/${appointment.id}`}
                  >
                    Entrar na chamada
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="history-empty" role="status">
          <h2>Nenhum atendimento confirmado</h2>
          <p>Quando você aceitar um pedido, ele aparecerá aqui.</p>
        </div>
      )}

      <Link className="next-call-secondary" href="/app/interpreter">
        Voltar à fila
      </Link>
    </section>
  );
}
