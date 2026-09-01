import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthBackLink } from "@/components/auth/AuthBackLink";
import { createClient } from "@/lib/supabase/server";

import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    redirect("/forgot-password");
  }

  return (
    <main className="auth-shell auth-shell-ios">
      <AuthBackLink href="/login" label="Voltar ao login" />

      <section
        className="auth-card auth-card-ios"
        aria-labelledby="reset-password-title"
      >
        <Link
          className="auth-brand auth-brand-centered"
          href="/"
          aria-label="Voltar ao início"
        >
          <Image src="/logo.png" alt="" width={80} height={80} priority />
          <span>Sinalize</span>
        </Link>

        <header className="auth-card-head">
          <h1 id="reset-password-title">Nova senha</h1>
          <p className="auth-intro">
            Escolha uma senha segura para acessar sua conta.
          </p>
        </header>

        <ResetPasswordForm />
      </section>
    </main>
  );
}
