import Image from "next/image";
import Link from "next/link";

export default function ConfirmPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card auth-card-compact" aria-labelledby="confirm-title">
        <Link className="auth-brand" href="/" aria-label="Voltar ao início">
          <Image src="/logo.png" alt="" width={80} height={80} priority />
          <span>Sinalize</span>
        </Link>

        <div>
          <p className="auth-eyebrow">Cadastro recebido</p>
          <h1 id="confirm-title">Confira seu e-mail</h1>
          <p className="auth-intro">
            Enviamos uma mensagem para confirmar sua conta. Depois da
            confirmação, volte para entrar.
          </p>
        </div>
        <Link className="auth-submit" href="/login">
          Ir para o login
        </Link>
      </section>
    </main>
  );
}
