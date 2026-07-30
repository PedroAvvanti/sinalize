import Image from "next/image";
import Link from "next/link";

import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="signup-title">
        <Link className="auth-brand" href="/" aria-label="Voltar ao início">
          <Image src="/logo.png" alt="" width={48} height={48} priority />
          <span>Sinalize</span>
        </Link>

        <div>
          <p className="auth-eyebrow">Comece agora</p>
          <h1 id="signup-title">Crie sua conta</h1>
          <p className="auth-intro">
            Escolha como você usará a plataforma. Contas administrativas não
            podem ser criadas por este formulário.
          </p>
        </div>

        <SignupForm />

        <p className="auth-switch">
          Já tem uma conta? <Link href="/login">Entrar</Link>
        </p>
      </section>
    </main>
  );
}
