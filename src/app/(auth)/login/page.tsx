import Image from "next/image";
import Link from "next/link";

import { AuthBackLink } from "@/components/auth/AuthBackLink";
import { loginMessageForError } from "@/lib/auth/policy";

import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[];
    next?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const message = loginMessageForError(params.error);
  const nextPath = typeof params.next === "string" ? params.next : undefined;

  return (
    <main className="auth-shell auth-shell-ios">
      <AuthBackLink />

      <section className="auth-card auth-card-ios" aria-labelledby="login-title">
        <Link className="auth-brand auth-brand-centered" href="/" aria-label="Voltar ao início">
          <Image src="/logo.png" alt="" width={80} height={80} priority />
          <span>Sinalize</span>
        </Link>

        <header className="auth-card-head">
          <h1 id="login-title">Entre na sua conta</h1>
          <p className="auth-intro">
            Acesse sua área com o e-mail usado no cadastro.
          </p>
        </header>

        {message ? (
          <p className="auth-error auth-error-ios" role="alert">
            {message}
          </p>
        ) : null}

        <LoginForm nextPath={nextPath} />

        <p className="auth-switch">
          Ainda não tem conta? <Link href="/signup">Cadastre-se</Link>
        </p>
      </section>
    </main>
  );
}
