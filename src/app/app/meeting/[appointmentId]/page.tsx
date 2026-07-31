import Link from "next/link";
import { redirect } from "next/navigation";

import { JitsiMeetEmbed } from "@/components/meeting/JitsiMeetEmbed";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { getJitsiDomain } from "@/lib/jitsi/config";
import { canEnterMeeting } from "@/lib/jitsi/meeting-access";
import { createClient } from "@/lib/supabase/server";

type MeetingPageProps = {
  params: Promise<{ appointmentId: string }>;
};

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { appointmentId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    redirect(profileUnavailableLoginPath());
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select(
      "id, requester_id, interpreter_id, status, scheduled_at, duration_minutes, jitsi_room_name",
    )
    .eq("id", appointmentId)
    .maybeSingle();

  if (appointmentError || !appointment) {
    return (
      <section className="app-panel meeting-page" aria-labelledby="meeting-title">
        <h1 id="meeting-title">Atendimento não encontrado</h1>
        <p className="meeting-lead" role="alert">
          Verifique o link recebido ou volte ao início.
        </p>
        <Link className="next-call-secondary" href={`/app/${profile.role}`}>
          Voltar ao início
        </Link>
      </section>
    );
  }

  const access = canEnterMeeting({
    appointment: {
      requesterId: appointment.requester_id,
      interpreterId: appointment.interpreter_id,
      status: appointment.status,
      scheduledAt: new Date(appointment.scheduled_at),
      durationMinutes: appointment.duration_minutes,
    },
    userId,
  });

  if (!access.ok) {
    return (
      <section className="app-panel meeting-page" aria-labelledby="meeting-title">
        <p className="auth-eyebrow">Videochamada</p>
        <h1 id="meeting-title">Sala indisponível</h1>
        <p className="meeting-lead" role="alert">
          {access.reason}
        </p>
        <Link className="next-call-secondary" href={`/app/${profile.role}`}>
          Voltar ao início
        </Link>
      </section>
    );
  }

  return (
    <section className="meeting-page meeting-page-live" aria-labelledby="meeting-title">
      <header className="meeting-page__header">
        <div>
          <p className="auth-eyebrow">Videochamada</p>
          <h1 id="meeting-title">Sala de atendimento</h1>
        </div>
        <Link className="next-call-secondary" href={`/app/${profile.role}`}>
          Sair da sala
        </Link>
      </header>

      <JitsiMeetEmbed
        domain={getJitsiDomain()}
        roomName={appointment.jitsi_room_name}
        displayName={profile.full_name.trim() || "Participante"}
      />
    </section>
  );
}
