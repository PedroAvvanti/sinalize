import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <section className="offline-card" aria-labelledby="offline-title">
        <p className="auth-eyebrow">Sem conexão</p>
        <h1 id="offline-title">Você está offline</h1>
        <p>
          Não foi possível carregar o Sinalize agora. Verifique sua internet e
          tente novamente.
        </p>
        <Link className="button button-primary" href="/">
          Voltar ao início
        </Link>
      </section>
    </main>
  );
}
