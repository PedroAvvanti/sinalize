import Image from "next/image";
import Link from "next/link";

import { AuthBackLink } from "@/components/auth/AuthBackLink";

import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="auth-shell auth-shell-ios">
      <AuthBackLink />

      <section className="auth-card auth-card-ios" aria-labelledby="signup-title">
        <Link className="auth-brand auth-brand-centered" href="/" aria-label="Voltar ao início">
          <Image src="/logo.png" alt="" width={80} height={80} priority />
          <span>Sinalize</span>
        </Link>

        <header className="auth-card-head">
          <h1 id="signup-title">Crie sua conta</h1>
          <p className="auth-intro">
            Escolha como você usará a plataforma. Contas administrativas não
            podem ser criadas por este formulário.
          </p>
        </header>

        <SignupForm />

        <p className="auth-switch">
          Já tem uma conta? <Link href="/login">Entrar</Link>
        </p>
      </section>
    </main>
  );
}
