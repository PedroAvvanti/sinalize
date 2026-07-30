import { redirect } from "next/navigation";

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

  return (
    <section className="app-panel" aria-labelledby="interpreter-home-title">
      <p className="auth-eyebrow">Área do intérprete</p>
      <h1 id="interpreter-home-title">Olá! Sua conta está pronta.</h1>
      <p>
        O envio de documentos e a agenda serão disponibilizados nas próximas
        etapas do MVP.
      </p>
    </section>
  );
}
