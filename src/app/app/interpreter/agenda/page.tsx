import Link from "next/link";
import { redirect } from "next/navigation";

import { expireStaleAppointments } from "@/actions/appointments";
import { WeekStrip } from "@/components/appointments/WeekStrip";
import { AppBackLink } from "@/components/navigation/AppBackLink";
import { APPOINTMENT_REASONS } from "@/lib/domain/reasons";
import { isUpcomingAppointment } from "@/lib/domain/meeting-access";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeStyle: "short",
});

type AgendaAppointment = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  | "id"
  | "status"
  | "scheduled_at"
  | "duration_minutes"
  | "reason_code"
  | "reason_text"
  | "requester_id"
>;

function reasonLabel(reasonCode: string) {
  return (
    APPOINTMENT_REASONS.find((option) => option.value === reasonCode)?.label ??
    "Atendimento"
  );
}

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

  const list = appointments ?? [];
  const requesterIds = [
    ...new Set(list.map((appointment) => appointment.requester_id)),
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

  function displayName(requesterId: string) {
    return requesterNames.get(requesterId)?.trim() || "Usuário";
  }

  function canEnterMeeting(appointment: AgendaAppointment) {
    return (
      appointment.status === "accepted" &&
      isUpcomingAppointment(
        new Date(appointment.scheduled_at),
        appointment.duration_minutes,
        now,
      )
    );
  }

  const weekAppointments = list.map((appointment) => ({
    id: appointment.id,
    scheduled_at: appointment.scheduled_at,
    status: appointment.status,
  }));

  return (
    <div className="agenda-desk">
      <AppBackLink href="/app/interpreter" label="Voltar à fila" />

      <header className="agenda-desk__header">
        <p className="auth-eyebrow">Agenda</p>
        <h1 id="agenda-title" className="agenda-desk__title">
          Atendimentos confirmados
        </h1>
        <p className="agenda-desk__lead">
          {list.length === 0
            ? "Aceite um pedido na fila para montar sua semana."
            : list.length === 1
              ? "1 atendimento na sua agenda."
              : `${list.length} atendimentos na sua agenda.`}
        </p>
      </header>

      <WeekStrip appointments={weekAppointments} referenceDate={now} />

      {appointmentsError ? (
        <p className="user-dashboard-error" role="alert">
          Não foi possível carregar a agenda. Recarregue a página.
        </p>
      ) : list.length === 0 ? (
        <div className="agenda-desk__empty" role="status">
          <h2>Nada confirmado ainda</h2>
          <p>Quando você aceitar um pedido, ele aparece aqui na linha do tempo.</p>
        </div>
      ) : (
        <ol className="agenda-clock" aria-labelledby="agenda-title">
          {list.map((appointment, index) => {
            const scheduledAt = new Date(appointment.scheduled_at);
            const isNext = index === 0;

            return (
              <li
                key={appointment.id}
                className={
                  isNext
                    ? "agenda-clock__item agenda-clock__item--next"
                    : "agenda-clock__item"
                }
              >
                <div className="agenda-clock__time" aria-hidden="true">
                  <span>{timeFormatter.format(scheduledAt)}</span>
                  <i />
                </div>
                <article className="agenda-clock__card">
                  {isNext ? (
                    <p className="agenda-clock__badge">Próximo</p>
                  ) : null}
                  <h2>{displayName(appointment.requester_id)}</h2>
                  <p className="agenda-clock__reason">
                    {reasonLabel(appointment.reason_code)}
                  </p>
                  <time dateTime={appointment.scheduled_at}>
                    {dateFormatter.format(scheduledAt)}
                  </time>
                  <p className="agenda-clock__duration">
                    {appointment.duration_minutes} minutos
                  </p>
                  {appointment.status === "cancel_requested" ? (
                    <span className="request-status-badge request-status-badge-cancel_requested">
                      Cancelamento em análise
                    </span>
                  ) : null}
                  {canEnterMeeting(appointment) ? (
                    <Link
                      className="user-request-link agenda-clock__enter"
                      href={`/app/meeting/${appointment.id}`}
                    >
                      Entrar na chamada <span aria-hidden="true">→</span>
                    </Link>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
