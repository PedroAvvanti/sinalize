import Link from "next/link";
import { redirect } from "next/navigation";

import { APPOINTMENT_REASONS } from "@/lib/domain/reasons";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { createClient } from "@/lib/supabase/server";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const statusLabels = {
  open: "Aberto",
  accepted: "Confirmado",
  cancel_requested: "Cancelamento",
  cancelled: "Cancelado",
  completed: "Concluído",
  expired: "Expirado",
} as const;

export default async function AdminAppointmentsPage() {
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

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select(
      "id, status, scheduled_at, duration_minutes, reason_code, requester_id, interpreter_id",
    )
    .order("scheduled_at", { ascending: false })
    .limit(100);

  const profileIds = [
    ...new Set(
      (appointments ?? []).flatMap((appointment) =>
        [appointment.requester_id, appointment.interpreter_id].filter(
          (id): id is string => Boolean(id),
        ),
      ),
    ),
  ];

  const { data: people } =
    profileIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", profileIds)
      : { data: [] as { id: string; full_name: string }[] };

  const names = new Map(
    (people ?? []).map((person) => [person.id, person.full_name.trim() || "—"]),
  );

  return (
    <section
      className="app-panel admin-appointments-page"
      aria-labelledby="admin-appointments-title"
    >
      <header className="admin-appointments-page__header">
        <p className="auth-eyebrow">Atendimentos</p>
        <h1 id="admin-appointments-title">Visão geral</h1>
        <p className="admin-appointments-page__lead">
          Acompanhe os últimos atendimentos e seus estados.
        </p>
      </header>

      {appointmentsError ? (
        <p className="admin-review-lead" role="alert">
          Não foi possível carregar os atendimentos. Recarregue a página.
        </p>
      ) : appointments?.length ? (
        <ul className="admin-appointments-list">
          {appointments.map((appointment) => {
            const reason =
              APPOINTMENT_REASONS.find(
                (option) => option.value === appointment.reason_code,
              )?.label ?? "Atendimento";

            return (
              <li key={appointment.id} className="admin-appointments-list__item">
                <div>
                  <p className="admin-appointments-list__reason">{reason}</p>
                  <time dateTime={appointment.scheduled_at}>
                    {dateFormatter.format(new Date(appointment.scheduled_at))}
                  </time>
                  <p className="admin-appointments-list__people">
                    Usuário: {names.get(appointment.requester_id) ?? "—"}
                    {appointment.interpreter_id
                      ? ` · Intérprete: ${names.get(appointment.interpreter_id) ?? "—"}`
                      : ""}
                  </p>
                </div>
                <span
                  className={`request-status-badge request-status-badge-${appointment.status}`}
                >
                  {statusLabels[appointment.status]}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="admin-review-empty" role="status">
          <p>Nenhum atendimento registrado ainda.</p>
        </div>
      )}

      <Link className="next-call-secondary" href="/app/admin">
        Voltar ao painel
      </Link>
    </section>
  );
}
