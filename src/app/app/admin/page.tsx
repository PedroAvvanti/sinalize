import Link from "next/link";

export default function AdminHomePage() {
  return (
    <section className="app-panel" aria-labelledby="admin-home-title">
      <p className="auth-eyebrow">Área administrativa</p>
      <h1 id="admin-home-title">Painel administrativo</h1>
      <p>
        Analise os certificados enviados por intérpretes e registre sua decisão.
      </p>
      <Link className="admin-queue-link" href="/app/admin/interpreters">
        Revisar candidaturas
        <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
