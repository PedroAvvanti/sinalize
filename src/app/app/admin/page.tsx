import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function AdminHomePage() {
  const supabase = await createClient();
  const { count: pendingApplications } = await supabase
    .from("interpreter_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: pendingCancellations } = await supabase
    .from("cancellation_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <section className="app-panel admin-home" aria-labelledby="admin-home-title">
      <p className="auth-eyebrow">Área administrativa</p>
      <h1 id="admin-home-title">Painel administrativo</h1>
      <p className="admin-home-lead">
        Revise candidaturas, decida cancelamentos e acompanhe o andamento do
        MVP.
      </p>

      <div className="admin-home-links">
        <Link className="admin-queue-link" href="/app/admin/interpreters">
          <span>
            Revisar candidaturas
            {pendingApplications ? (
              <small>{pendingApplications} pendente(s)</small>
            ) : null}
          </span>
          <span aria-hidden="true">→</span>
        </Link>

        <Link className="admin-queue-link" href="/app/admin/cancellations">
          <span>
            Decidir cancelamentos
            {pendingCancellations ? (
              <small>{pendingCancellations} pendente(s)</small>
            ) : null}
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
