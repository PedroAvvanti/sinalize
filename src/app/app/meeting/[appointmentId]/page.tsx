import Link from "next/link";
import { redirect } from "next/navigation";

import { JitsiMeetEmbed } from "@/components/meeting/JitsiMeetEmbed";
import { LeaveMeetingButton } from "@/components/meeting/LeaveMeetingButton";
import { MeetingAtmosphere } from "@/components/meeting/MeetingAtmosphere";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { appointmentReasonDisplayLabel } from "@/lib/domain/reasons";
import {
  getJitsiDomain,
  requiresJitsiHostLogin,
} from "@/lib/jitsi/config";
import { canEnterMeeting } from "@/lib/jitsi/meeting-access";
import { createClient } from "@/lib/supabase/server";

type MeetingPageProps = {
  params: Promise<{ appointmentId: string }>;
};

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

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
      "id, requester_id, interpreter_id, status, scheduled_at, duration_minutes, reason_code, reason_custom_title, jitsi_room_name",
    )
    .eq("id", appointmentId)
    .maybeSingle();

  if (appointmentError || !appointment) {
    return (
      <section
        className="meeting-studio meeting-studio--idle"
        aria-labelledby="meeting-title"
      >
        <p className="auth-eyebrow">Videochamada</p>
        <h1 id="meeting-title" className="meeting-studio__title">
          Atendimento não encontrado
        </h1>
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
      <section
        className="meeting-studio meeting-studio--idle"
        aria-labelledby="meeting-title"
      >
        <p className="auth-eyebrow">Videochamada</p>
        <h1 id="meeting-title" className="meeting-studio__title">
          Sala indisponível
        </h1>
        <p className="meeting-lead" role="alert">
          {access.reason}
        </p>
        <Link className="next-call-secondary" href={`/app/${profile.role}`}>
          Voltar ao início
        </Link>
      </section>
    );
  }

  const jitsiDomain = getJitsiDomain();
  const leaveRole =
    appointment.requester_id === userId ? "user" : "interpreter";
  const scheduledAt = new Date(appointment.scheduled_at);
  const reason = appointmentReasonDisplayLabel(
    appointment.reason_code,
    appointment.reason_custom_title,
  );

  return (
    <section
      className="meeting-studio meeting-studio--live"
      aria-labelledby="meeting-title"
    >
      <MeetingAtmosphere />

      <header className="meeting-studio__chrome">
        <div className="meeting-studio__identity">
          <span className="meeting-studio__live">
            <i aria-hidden="true" />
            Ao vivo
          </span>
          <div className="meeting-studio__heading">
            <p className="auth-eyebrow">Videochamada</p>
            <h1 id="meeting-title" className="meeting-studio__title">
              Sala de atendimento
            </h1>
          </div>
        </div>

        <ul className="meeting-studio__meta" aria-label="Detalhes da sessão">
          <li>
            <span className="meeting-studio__meta-label">Horário</span>
            <time dateTime={appointment.scheduled_at}>
              {timeFormatter.format(scheduledAt)}
            </time>
          </li>
          <li>
            <span className="meeting-studio__meta-label">Duração</span>
            <span>{appointment.duration_minutes} min</span>
          </li>
          <li>
            <span className="meeting-studio__meta-label">Motivo</span>
            <span className="meeting-studio__reason">{reason}</span>
          </li>
        </ul>

        <LeaveMeetingButton appointmentId={appointment.id} role={leaveRole} />
      </header>

      {requiresJitsiHostLogin(jitsiDomain) ? (
        <p className="meeting-host-hint" role="note">
          A primeira pessoa a entrar deve clicar em{" "}
          <strong>Eu sou o anfitrião</strong> na tela do Jitsi para liberar a
          sala. A outra pessoa pode aguardar.
        </p>
      ) : null}

      <div className="meeting-studio__stage">
        <JitsiMeetEmbed
          domain={jitsiDomain}
          roomName={appointment.jitsi_room_name}
          displayName={profile.full_name.trim() || "Participante"}
        />
      </div>
    </section>
  );
}
