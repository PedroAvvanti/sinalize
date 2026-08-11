import Image from "next/image";

import { LandingAudienceCards } from "@/components/landing/LandingAudienceCards";
import { LandingSteps } from "@/components/landing/LandingSteps";

const steps = [
  {
    title: "Agende",
    description:
      "Escolha o horário que funciona para você e descreva o contexto da conversa.",
    details:
      "Você define data, horário e o tipo de situação — consulta médica, reunião de trabalho, conversa com família ou outro contexto. Esse detalhe ajuda o intérprete a se preparar e garantir uma comunicação mais fluida desde o primeiro minuto.",
  },
  {
    title: "Conecte",
    description:
      "Entre na videochamada com um intérprete de Libras validado pela plataforma.",
    details:
      "No horário agendado, acesse a videochamada direto pela Sinalize, sem instalar programas extras. O intérprete já estará disponível para iniciar a sessão com você em um ambiente seguro e dedicado ao atendimento.",
  },
  {
    title: "Comunique",
    description:
      "Converse com autonomia — no consultório, no trabalho ou no dia a dia.",
    details:
      "Com o intérprete na chamada, você participa da conversa com autonomia: expressa suas ideias, faz perguntas e entende as respostas em tempo real. Ao final, pode avaliar a experiência e consultar o histórico dos seus atendimentos.",
  },
];

const audiences = [
  {
    title: "Pessoas surdas",
    description:
      "Acesso a intérprete quando precisar, sem depender de terceiros para intermediar.",
    details:
      "A Sinalize coloca você no centro da comunicação. Agende quando precisar, escolha o contexto da conversa e conecte-se com intérpretes validados — no consultório, no trabalho, em reuniões ou no dia a dia, sem depender de familiares ou amigos para intermediar.",
  },
  {
    title: "Intérpretes de Libras",
    description:
      "Atenda em videochamada, com agenda organizada e credenciais validadas pela plataforma.",
    details:
      "Cadastre-se, envie suas certificações para validação e receba solicitações de atendimento alinhadas à sua disponibilidade. Você entra na chamada pelo Sinalize, conduz a interpretação em um ambiente dedicado e constrói reputação com avaliações dos usuários.",
  },
  {
    title: "Empresas e serviços",
    description:
      "Atendimento inclusivo em reuniões, consultas e situações que exigem Libras.",
    details:
      "Clínicas, escolas, empresas e prestadores de serviço podem oferecer atendimento em Libras sob demanda. Agende sessões para reuniões, atendimentos ao cliente ou capacitações e conte com intérpretes verificados pela plataforma.",
  },
];

const highlights = [
  {
    title: "Profissionais validados",
    description: "Intérpretes com credenciais verificadas antes de atender.",
  },
  {
    title: "No seu tempo",
    description: "Agende com antecedência e organize a conversa quando for melhor.",
  },
  {
    title: "Videochamada segura",
    description: "Ambiente dedicado para a sessão, sem instalar apps extras.",
  },
  {
    title: "Histórico e avaliações",
    description: "Revise atendimentos anteriores e avalie a experiência.",
  },
];

export default function Home() {
  return (
    <main className="landing">
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

      <div className="landing-intro">
        <div className="landing-atmosphere" aria-hidden="true">
          <div className="landing-hero-blob" />
          <div className="gesture-orbit">
            <span />
            <span />
            <span />
          </div>
        </div>

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
            <div className="signal-ring signal-ring-far" />
            <div className="signal-ring signal-ring-outer" />
            <div className="signal-ring signal-ring-mid" />
            <div className="signal-ring signal-ring-inner" />
            <Image src="/logo.png" alt="" width={360} height={360} priority />
          </div>
        </section>

        <footer className="landing-intro-footer">
          <span aria-hidden="true">●</span>
          Atendimento acessível, no seu tempo.
          <span className="landing-scroll-hint">Role para conhecer mais</span>
        </footer>
      </div>

      <div className="landing-scroll">
        <section
          className="landing-section"
          aria-labelledby="how-title"
          id="como-funciona"
        >
          <p className="eyebrow landing-section-eyebrow">Simples e direto</p>
          <h2 className="landing-heading" id="how-title">
            Como <span>funciona</span>
          </h2>
          <LandingSteps steps={steps} />
        </section>

        <section
          className="landing-section landing-section-panel"
          aria-labelledby="audience-title"
        >
          <p className="eyebrow landing-section-eyebrow">Quem pode usar</p>
          <h2 className="landing-heading" id="audience-title">
            Para <span>quem é</span>
          </h2>
          <LandingAudienceCards audiences={audiences} />
        </section>

        <section
          className="landing-section"
          aria-labelledby="highlights-title"
        >
          <p className="eyebrow landing-section-eyebrow">Por dentro da plataforma</p>
          <h2 className="landing-heading" id="highlights-title">
            O que você <span>ganha</span>
          </h2>
          <ul className="landing-highlights">
            {highlights.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing-cta" aria-labelledby="cta-title">
          <div className="landing-cta-inner">
            <p className="eyebrow landing-section-eyebrow">Pronto para começar?</p>
            <h2 className="landing-heading" id="cta-title">
              Sua próxima conversa <span>começa aqui.</span>
            </h2>
            <p className="landing-cta-copy">
              Crie sua conta em minutos e agende o primeiro atendimento com um
              intérprete de Libras.
            </p>
            <div className="actions" aria-label="Criar conta ou entrar">
              <a className="button button-primary" href="/signup">
                Criar conta
              </a>
              <a className="button button-secondary" href="/login">
                Entrar
              </a>
            </div>
          </div>
        </section>

        <footer className="landing-footer">
          <span className="landing-footer-brand">Sinalize</span>
          <p>Comunicação acessível por videochamada com intérpretes de Libras.</p>
        </footer>
      </div>
    </main>
  );
}
