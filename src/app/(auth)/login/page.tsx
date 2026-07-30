import Image from "next/image";
import Link from "next/link";

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
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <Link className="auth-brand" href="/" aria-label="Voltar ao início">
          <Image src="/logo.png" alt="" width={48} height={48} priority />
          <span>Sinalize</span>
        </Link>

        <div>
          <p className="auth-eyebrow">Bem-vindo de volta</p>
          <h1 id="login-title">Entre na sua conta</h1>
          <p className="auth-intro">
            Acesse sua área com o e-mail usado no cadastro.
          </p>
        </div>

        {message ? (
          <p className="auth-error" role="alert">
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
