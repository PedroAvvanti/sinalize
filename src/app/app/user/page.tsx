import Link from "next/link";

export default function UserHomePage() {
  return (
    <section className="app-panel" aria-labelledby="user-home-title">
      <p className="auth-eyebrow">Área do usuário</p>
      <h1 id="user-home-title">Olá! Sua conta está pronta.</h1>
      <p>
        Solicite um atendimento informando a data, a duração e o motivo.
      </p>
      <Link className="user-request-link" href="/app/user/request">
        Solicitar atendimento <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
