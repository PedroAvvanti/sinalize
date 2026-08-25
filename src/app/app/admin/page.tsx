import Link from "next/link";

import { DecisionMark } from "@/components/admin/DecisionMark";
import { createClient } from "@/lib/supabase/server";

function formatPending(count: number) {
  return count === 1 ? "1 pendente" : `${count} pendentes`;
}

function formatActive(count: number) {
  return count === 1 ? "1 ativo" : `${count} ativos`;
}

function formatAttentionLead(count: number) {
  if (count === 0) {
    return "Nenhuma pendência no momento. Acompanhe a operação abaixo.";
  }

  if (count === 1) {
    return "1 item aguardando decisão. Comece pela fila com atenção.";
  }

  return `${count} itens aguardando decisão. Comece pelas filas abaixo.`;
}

function heroTitle(attentionTotal: number) {
  return attentionTotal > 0 ? "Há decisões na mesa." : "Mesa em dia.";
}

export default async function AdminHomePage() {
  const supabase = await createClient();

  const [
    { count: pendingApplications },
    { count: pendingCancellations },
    { count: openAppointments },
    { count: confirmedAppointments },
  ] = await Promise.all([
    supabase
      .from("interpreter_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("cancellation_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted"),
  ]);

  const applicationsCount = pendingApplications ?? 0;
  const cancellationsCount = pendingCancellations ?? 0;
  const openCount = openAppointments ?? 0;
  const confirmedCount = confirmedAppointments ?? 0;
  const attentionTotal = applicationsCount + cancellationsCount;
  const activeTotal = openCount + confirmedCount;

  const decisions = [
    {
      href: "/app/admin/interpreters",
      title: "Candidaturas",
      description: "Aprovar ou recusar intérpretes que se candidataram.",
      countLabel: formatPending(applicationsCount),
      count: applicationsCount,
      hasAttention: applicationsCount > 0,
    },
    {
      href: "/app/admin/cancellations",
      title: "Cancelamentos",
      description: "Avaliar pedidos de cancelamento de atendimentos.",
      countLabel: formatPending(cancellationsCount),
      count: cancellationsCount,
      hasAttention: cancellationsCount > 0,
    },
  ] as const;

  const tower = [
    {
      key: "applications",
      label: "Candidaturas",
      value: applicationsCount,
      tone: applicationsCount > 0 ? "attention" : "neutral",
      href: "/app/admin/interpreters",
    },
    {
      key: "cancellations",
      label: "Cancelamentos",
      value: cancellationsCount,
      tone: cancellationsCount > 0 ? "attention" : "neutral",
      href: "/app/admin/cancellations",
    },
    {
      key: "open",
      label: "Abertos",
      value: openCount,
      tone: "neutral",
      href: "/app/admin/appointments",
    },
    {
      key: "confirmed",
      label: "Confirmados",
      value: confirmedCount,
      tone: "neutral",
      href: "/app/admin/appointments",
    },
  ] as const;

  return (
    <div className="admin-desk">
      <section className="admin-hero" aria-labelledby="admin-home-title">
        <DecisionMark />
        <div className="admin-hero__copy">
          <p className="auth-eyebrow">Mesa de decisão</p>
          <h1 id="admin-home-title" className="admin-hero__title">
            {heroTitle(attentionTotal)}
          </h1>
          <p className="admin-hero__lead">
            {formatAttentionLead(attentionTotal)}
          </p>
        </div>
        {attentionTotal > 0 ? (
          <p className="admin-hero__status" aria-live="polite">
            <i aria-hidden="true" />
            {attentionTotal === 1
              ? "1 decisão pendente"
              : `${attentionTotal} decisões pendentes`}
          </p>
        ) : (
          <p className="admin-hero__status admin-hero__status--clear">
            <i aria-hidden="true" />
            Operação sem filas
          </p>
        )}
      </section>

      <section
        className="admin-decisions"
        aria-labelledby="admin-decisions-title"
      >
        <div className="admin-section-heading">
          <h2 id="admin-decisions-title">Filas de decisão</h2>
          <p>O que precisa de ação agora.</p>
        </div>

        <div className="admin-decision-grid">
          {decisions.map((decision) => (
            <Link
              key={decision.href}
              className={
                decision.hasAttention
                  ? "admin-decision-card admin-decision-card--attention"
                  : "admin-decision-card"
              }
              href={decision.href}
            >
              <span className="admin-decision-card__count" aria-hidden="true">
                {decision.count}
              </span>
              <span className="admin-decision-card__body">
                <span className="admin-decision-card__title">
                  {decision.title}
                </span>
                <small className="admin-decision-card__meta">
                  {decision.countLabel}
                </small>
                <span className="admin-decision-card__desc">
                  {decision.description}
                </span>
              </span>
              <span className="admin-decision-card__arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}

          <Link
            className="admin-decision-card admin-decision-card--quiet"
            href="/app/admin/appointments"
          >
            <span className="admin-decision-card__body">
              <span className="admin-decision-card__title">Atendimentos</span>
              <small className="admin-decision-card__meta">
                {formatActive(activeTotal)}
              </small>
              <span className="admin-decision-card__desc">
                Visão geral de status, horários e participantes.
              </span>
            </span>
            <span className="admin-decision-card__arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </section>

      <section className="admin-tower" aria-labelledby="admin-tower-title">
        <div className="admin-section-heading">
          <h2 id="admin-tower-title">Torre de controle</h2>
          <p>Leitura rápida da operação.</p>
        </div>

        <div className="admin-tower-rail" aria-label="Resumo operacional">
          {tower.map((metric) => (
            <Link
              key={metric.key}
              className={`admin-tower-metric admin-tower-metric--${metric.tone}`}
              href={metric.href}
            >
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
