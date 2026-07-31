import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/ProfileForm";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { createClient } from "@/lib/supabase/server";

export default async function UserProfilePage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name, theme_preference, average_rating")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    redirect(profileUnavailableLoginPath());
  }

  if (profile.role !== "user") {
    redirect(`/app/${profile.role}`);
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
        roleLabel="Usuário"
      />

      <Link className="next-call-secondary" href="/app/user">
        Voltar ao início
      </Link>
    </section>
  );
}
