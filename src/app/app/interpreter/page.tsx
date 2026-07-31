import { redirect } from "next/navigation";

import { expireStaleAppointments } from "@/actions/appointments";
import { OpenRequestsList } from "@/components/appointments/OpenRequestsList";
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

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_at, duration_minutes, reason_code, reason_text",
    )
    .eq("status", "open")
    .order("scheduled_at", { ascending: true });

  return (
    <section
      className="app-panel interpreter-queue"
      aria-labelledby="interpreter-home-title"
    >
      <header className="interpreter-queue__header">
        <div>
          <p className="auth-eyebrow">Fila ao vivo</p>
          <h1 id="interpreter-home-title">Pedidos disponíveis</h1>
          <p>
            Escolha um atendimento. A fila se atualiza quando outro intérprete
            aceita um pedido.
          </p>
        </div>
        <span className="interpreter-queue__live">
          <i aria-hidden="true" />
          Atualização em tempo real
        </span>
      </header>

      <OpenRequestsList
        initialAppointments={appointments ?? []}
        initialError={
          appointmentsError
            ? "Não foi possível carregar a fila. Recarregue a página."
            : undefined
        }
      />
    </section>
  );
}
