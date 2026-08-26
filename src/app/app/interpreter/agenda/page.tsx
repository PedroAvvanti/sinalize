import { redirect } from "next/navigation";

import { expireStaleAppointments } from "@/actions/appointments";
import {
  InterpreterAgendaBoard,
  type AgendaBoardAppointment,
} from "@/components/appointments/InterpreterAgendaBoard";
import { AppBackLink } from "@/components/navigation/AppBackLink";
import { isUpcomingAppointment } from "@/lib/domain/meeting-access";
import { createClient } from "@/lib/supabase/server";

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
      "id, status, scheduled_at, duration_minutes, reason_code, reason_custom_title, reason_text, requester_id",
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

  const boardAppointments: AgendaBoardAppointment[] = list.map(
    (appointment) => ({
      id: appointment.id,
      status: appointment.status,
      scheduled_at: appointment.scheduled_at,
      duration_minutes: appointment.duration_minutes,
      reason_code: appointment.reason_code,
      reason_custom_title: appointment.reason_custom_title,
      requester_name:
        requesterNames.get(appointment.requester_id)?.trim() || "Usuário",
      can_enter:
        appointment.status === "accepted" &&
        isUpcomingAppointment(
          new Date(appointment.scheduled_at),
          appointment.duration_minutes,
          now,
        ),
    }),
  );

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
              ? "1 atendimento na sua agenda. Toque em um dia para filtrar."
              : `${list.length} atendimentos na sua agenda. Toque em um dia para filtrar.`}
        </p>
      </header>

      <InterpreterAgendaBoard
        appointments={boardAppointments}
        weekAppointments={weekAppointments}
        referenceIso={now.toISOString()}
        loadError={Boolean(appointmentsError)}
      />
    </div>
  );
}
