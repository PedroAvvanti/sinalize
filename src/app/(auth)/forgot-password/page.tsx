import Image from "next/image";
import Link from "next/link";

import { AuthBackLink } from "@/components/auth/AuthBackLink";

import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-shell auth-shell-ios">
      <AuthBackLink href="/login" label="Voltar ao login" />

      <section
        className="auth-card auth-card-ios"
        aria-labelledby="forgot-password-title"
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
          <h1 id="forgot-password-title">Esqueceu sua senha?</h1>
          <p className="auth-intro">
            Informe seu e-mail e enviaremos um link para criar uma nova senha.
          </p>
        </header>

        <ForgotPasswordForm />
      </section>
    </main>
  );
}
