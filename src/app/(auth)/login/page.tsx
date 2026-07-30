import Image from "next/image";
import Link from "next/link";

import { LoginForm } from "./login-form";

export default function LoginPage() {
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

        <LoginForm />

        <p className="auth-switch">
          Ainda não tem conta? <Link href="/signup">Cadastre-se</Link>
        </p>
      </section>
    </main>
  );
}
