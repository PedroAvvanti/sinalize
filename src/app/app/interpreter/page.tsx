import Link from "next/link";
import { redirect } from "next/navigation";

import { expireStaleAppointments } from "@/actions/appointments";
import { OpenRequestsList } from "@/components/appointments/OpenRequestsList";
import { LivePulse } from "@/components/interpreters/LivePulse";
import { createClient } from "@/lib/supabase/server";

export default async function InterpreterHomePage() {
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
    supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", userId)
      .single(),
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

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_at, duration_minutes, reason_code, reason_text",
    )
    .eq("status", "open")
    .order("scheduled_at", { ascending: true });

  const greeting = profile.full_name?.trim()
    ? `Olá, ${profile.full_name.trim()}.`
    : "Olá.";

  return (
    <div className="interpreter-desk">
      <section
        className="interpreter-hero"
        aria-labelledby="interpreter-home-title"
      >
        <LivePulse />
        <div className="interpreter-hero__copy">
          <p className="auth-eyebrow">Fila ao vivo</p>
          <h1 id="interpreter-home-title" className="interpreter-hero__title">
            {greeting}
          </h1>
          <p className="interpreter-hero__lead">
            Escolha um atendimento. A fila se atualiza quando outro intérprete
            aceita um pedido.
          </p>
        </div>
        <div className="interpreter-hero__meta">
          <Link className="next-call-secondary" href="/app/interpreter/agenda">
            Ver agenda
          </Link>
          <span className="interpreter-live" aria-live="polite">
            <i aria-hidden="true" />
            Ao vivo
          </span>
        </div>
      </section>

      <OpenRequestsList
        initialAppointments={appointments ?? []}
        initialError={
          appointmentsError
            ? "Não foi possível carregar a fila. Recarregue a página."
            : undefined
        }
      />
    </div>
  );
}
