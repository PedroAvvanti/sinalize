import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

function formatPending(count: number) {
  return count === 1 ? "1 pendente" : `${count} pendentes`;
}

function formatActive(count: number) {
  return count === 1 ? "1 ativo" : `${count} ativos`;
}

function formatAttentionLead(count: number) {
  if (count === 0) {
    return "Nenhuma pendência no momento. Acompanhe o andamento do MVP.";
  }

  if (count === 1) {
    return "1 item aguardando decisão. Revise as filas abaixo.";
  }

  return `${count} itens aguardando decisão. Revise as filas abaixo.`;
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

  const metrics = [
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

  const queues = [
    {
      href: "/app/admin/interpreters",
      title: "Revisar candidaturas",
      description: "Aprovar ou recusar intérpretes que se candidataram.",
      countLabel: formatPending(applicationsCount),
      hasAttention: applicationsCount > 0,
    },
    {
      href: "/app/admin/cancellations",
      title: "Decidir cancelamentos",
      description: "Avaliar pedidos de cancelamento de atendimentos.",
      countLabel: formatPending(cancellationsCount),
      hasAttention: cancellationsCount > 0,
    },
    {
      href: "/app/admin/appointments",
      title: "Visão geral de atendimentos",
      description: "Acompanhar status, horários e participantes.",
      countLabel: formatActive(openCount + confirmedCount),
      hasAttention: false,
    },
  ] as const;

  return (
    <section className="app-panel admin-home" aria-labelledby="admin-home-title">
      <header className="admin-home-header">
        <p className="auth-eyebrow">Área administrativa</p>
        <h1 id="admin-home-title">Painel administrativo</h1>
        <p className="admin-home-lead">{formatAttentionLead(attentionTotal)}</p>
      </header>

      <section
        className="admin-home-metrics"
        aria-label="Resumo operacional"
      >
        {metrics.map((metric) => (
          <Link
            key={metric.key}
            className={`admin-home-metric admin-home-metric--${metric.tone}`}
            href={metric.href}
          >
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </Link>
        ))}
      </section>

      <section className="admin-home-queues" aria-labelledby="admin-home-queues-title">
        <div className="admin-home-queues-heading">
          <h2 id="admin-home-queues-title">Filas</h2>
          <p>Atalhos para o trabalho do dia.</p>
        </div>

        <div className="admin-home-links">
          {queues.map((queue) => (
            <Link
              key={queue.href}
              className={
                queue.hasAttention
                  ? "admin-queue-link admin-queue-link--attention"
                  : "admin-queue-link"
              }
              href={queue.href}
            >
              <span className="admin-queue-link__body">
                <span className="admin-queue-link__title">{queue.title}</span>
                <small className="admin-queue-link__meta">
                  {queue.countLabel}
                </small>
                <span className="admin-queue-link__desc">{queue.description}</span>
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
