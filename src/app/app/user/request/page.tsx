import { redirect } from "next/navigation";

import { AppointmentRequestForm } from "@/components/appointments/AppointmentRequestForm";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { createClient } from "@/lib/supabase/server";

export default async function AppointmentRequestPage() {
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

  if (profile.role !== "user") {
    redirect(`/app/${profile.role}`);
  }

  return (
    <section
      className="app-panel appointment-request-panel"
      aria-labelledby="request-title"
    >
      <div>
        <p className="auth-eyebrow">Novo atendimento</p>
        <h1 id="request-title">Solicite um intérprete</h1>
        <p className="appointment-request-lead">
          Informe quando precisa do atendimento e o contexto para que sua
          solicitação possa ser encontrada.
        </p>
      </div>
      <AppointmentRequestForm />
    </section>
  );
}
