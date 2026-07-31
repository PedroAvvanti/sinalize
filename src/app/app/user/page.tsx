import Link from "next/link";
import { redirect } from "next/navigation";

import {
  NextCallHero,
  type NextCallAppointment,
} from "@/components/appointments/NextCallHero";
import { RequestStatusList } from "@/components/appointments/RequestStatusList";
import { WeekStrip } from "@/components/appointments/WeekStrip";
import { EmptyState } from "@/components/ui/EmptyState";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { isUpcomingAppointment } from "@/lib/domain/meeting-access";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_STATUSES = ["open", "accepted", "cancel_requested"] as const;

function pickNextCall(
  appointments: NextCallAppointment[],
  now: Date,
): NextCallAppointment | null {
  const upcoming = appointments.filter((appointment) =>
    isUpcomingAppointment(
      new Date(appointment.scheduled_at),
      appointment.duration_minutes,
      now,
    ),
  );

  if (upcoming.length === 0) {
    return null;
  }

  upcoming.sort(
    (a, b) =>
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
  );

  const confirmed = upcoming.find(
    (appointment) =>
      appointment.status === "accepted" ||
      appointment.status === "cancel_requested",
  );

  return confirmed ?? upcoming[0];
}

export default async function UserHomePage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    redirect(profileUnavailableLoginPath());
  }

  if (profile.role !== "user") {
    redirect(`/app/${profile.role}`);
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [
    { data: activeAppointments, error: activeError },
    { data: weekAppointments, error: weekError },
    { data: recentAppointments, error: recentError },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, status, scheduled_at, duration_minutes, reason_code, reason_text",
      )
      .eq("requester_id", userId)
      .in("status", ACTIVE_STATUSES)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("appointments")
      .select("id, scheduled_at, status")
      .eq("requester_id", userId)
      .gte("scheduled_at", weekStart.toISOString())
      .lt("scheduled_at", weekEnd.toISOString())
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("appointments")
      .select("id, status, scheduled_at, duration_minutes, reason_code")
      .eq("requester_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (activeError || weekError || recentError) {
    return (
      <section className="app-panel user-dashboard" aria-labelledby="user-home-title">
        <p className="auth-eyebrow">Área do usuário</p>
        <h1 id="user-home-title">Não foi possível carregar seu início</h1>
        <p className="user-dashboard-error" role="alert">
          Recarregue a página em alguns instantes.
        </p>
      </section>
    );
  }

  const activeList = (activeAppointments ?? []) as NextCallAppointment[];
  const nextCall = pickNextCall(activeList, now);
  const hasAnyUpcoming = activeList.some((appointment) =>
    isUpcomingAppointment(
      new Date(appointment.scheduled_at),
      appointment.duration_minutes,
      now,
    ),
  );

  return (
    <div className="user-dashboard">
      <NextCallHero
        appointment={nextCall}
        requesterName={profile.full_name}
      />

      <WeekStrip appointments={weekAppointments ?? []} referenceDate={now} />

      {!hasAnyUpcoming ? (
        <EmptyState
          icon="◎"
          title="Nenhuma chamada agendada"
          description="Solicite um intérprete quando precisar de apoio em Libras."
          action={
            <Link className="user-request-link" href="/app/user/request">
              Solicitar intérprete <span aria-hidden="true">→</span>
            </Link>
          }
        />
      ) : null}

      <RequestStatusList appointments={recentAppointments ?? []} />
    </div>
  );
}
