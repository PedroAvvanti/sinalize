import { redirect } from "next/navigation";

import type { NextCallAppointment } from "@/components/appointments/NextCallHero";
import type { PendingReview } from "@/components/appointments/PendingReviewBanner";
import type { RequestStatusItem } from "@/components/appointments/RequestStatusList";
import { UserHomeRealtime } from "@/components/appointments/UserHomeRealtime";
import type { WeekAppointment } from "@/components/appointments/WeekStrip";
import { expireStaleAppointments } from "@/actions/appointments";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_STATUSES = ["open", "accepted", "cancel_requested"] as const;

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

  await expireStaleAppointments();

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [
    { data: activeAppointments, error: activeError },
    { data: weekAppointments, error: weekError },
    { data: recentAppointments, error: recentError },
    { data: completedAppointments },
    { data: userReviews },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, status, scheduled_at, duration_minutes, reason_code, reason_custom_title, reason_text",
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
      .select(
        "id, status, scheduled_at, duration_minutes, reason_code, reason_custom_title",
      )
      .eq("requester_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("appointments")
      .select(
        "id, scheduled_at, duration_minutes, reason_code, reason_custom_title, interpreter_id",
      )
      .eq("requester_id", userId)
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("reviews")
      .select("appointment_id")
      .eq("from_profile_id", userId),
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

  const reviewedIds = new Set(
    (userReviews ?? []).map((review) => review.appointment_id),
  );
  const pendingReviewRow =
    (completedAppointments ?? []).find(
      (appointment) => !reviewedIds.has(appointment.id),
    ) ?? null;

  let pendingReview: PendingReview | null = null;

  if (pendingReviewRow) {
    let interpreterName: string | null = null;

    if (pendingReviewRow.interpreter_id) {
      const { data: interpreter } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", pendingReviewRow.interpreter_id)
        .maybeSingle();

      interpreterName = interpreter?.full_name ?? null;
    }

    pendingReview = {
      id: pendingReviewRow.id,
      scheduled_at: pendingReviewRow.scheduled_at,
      duration_minutes: pendingReviewRow.duration_minutes,
      reason_code: pendingReviewRow.reason_code,
      reason_custom_title: pendingReviewRow.reason_custom_title,
      interpreter_name: interpreterName,
    };
  }

  return (
    <UserHomeRealtime
      userId={userId}
      requesterName={profile.full_name}
      initialActive={(activeAppointments ?? []) as NextCallAppointment[]}
      initialWeek={(weekAppointments ?? []) as WeekAppointment[]}
      initialRecent={(recentAppointments ?? []) as RequestStatusItem[]}
      pendingReview={pendingReview}
    />
  );
}
