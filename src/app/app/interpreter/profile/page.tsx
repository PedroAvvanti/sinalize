import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/actions/auth";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { createClient } from "@/lib/supabase/server";

export default async function InterpreterProfilePage() {
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
      .select("role, full_name, theme_preference, average_rating")
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

  if (profileError || !profile) {
    redirect(profileUnavailableLoginPath());
  }

  if (
    profile.role !== "interpreter" ||
    applicationError ||
    application?.status !== "approved"
  ) {
    redirect("/app/interpreter/onboarding");
  }

  return (
    <section className="app-panel profile-page" aria-labelledby="profile-title">
      <header className="profile-page__header">
        <p className="auth-eyebrow">Perfil</p>
        <h1 id="profile-title">Seus dados</h1>
        <p className="profile-page__lead">
          Atualize seu nome e escolha o tema da interface.
        </p>
      </header>

      <ProfileForm
        initialName={profile.full_name}
        averageRating={profile.average_rating}
        roleLabel="Intérprete"
      />

      <form action={signOutAction} className="profile-signout">
        <button className="app-signout" type="submit">
          Sair
        </button>
      </form>

      <Link className="next-call-secondary" href="/app/interpreter">
        Voltar à fila
      </Link>
    </section>
  );
}
