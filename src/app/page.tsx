import Image from "next/image";

export default function Home() {
  return (
    <main className="landing">
      <div className="gesture-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <header className="brand">
        <Image
          src="/logo.png"
          alt=""
          width={80}
          height={80}
          priority
        />
        <span>Sinalize</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Comunicação que aproxima</p>
          <h1 id="hero-title">
            Sua conversa
            <span> em boas mãos.</span>
          </h1>
          <p className="intro">
            Agende uma videochamada com um intérprete de Libras e comunique-se
            com autonomia quando precisar.
          </p>

          <div className="actions" aria-label="Acesso à plataforma">
            <a className="button button-primary" href="/signup">
              Criar conta
            </a>
            <a className="button button-secondary" href="/login">
              Entrar
            </a>
          </div>
        </div>

        <div className="logo-stage" aria-hidden="true">
          <div className="signal-ring signal-ring-outer" />
          <div className="signal-ring signal-ring-inner" />
          <Image src="/logo.png" alt="" width={360} height={360} priority />
        </div>
      </section>

      <footer>
        <span aria-hidden="true">●</span>
        Atendimento acessível, no seu tempo.
      </footer>
    </main>
  );
}
