import Link from "next/link";
import { redirect } from "next/navigation";

import { InterpreterReviewCard } from "@/components/admin/InterpreterReviewCard";
import { AppBackLink } from "@/components/navigation/AppBackLink";
import {
  applicationDecisionLabel,
  INTERPRETER_HISTORY_LIMIT,
  resolveInterpreterReviewView,
} from "@/lib/domain/interpreters";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { createClient } from "@/lib/supabase/server";

const SIGNED_CERTIFICATE_TTL_SECONDS = 10 * 60;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

type AdminInterpretersPageProps = {
  searchParams: Promise<{ view?: string | string[] }>;
};

export default async function AdminInterpretersPage({
  searchParams,
}: AdminInterpretersPageProps) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    redirect(profileUnavailableLoginPath());
  }

  if (profile.role !== "admin") {
    redirect(`/app/${profile.role}`);
  }

  const params = await searchParams;
  const view = resolveInterpreterReviewView(params.view);

  const { count: pendingCount } = await supabase
    .from("interpreter_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <section
      className="app-panel admin-review-page"
      aria-labelledby="admin-interpreters-title"
    >
      <AppBackLink href="/app/admin" />
      <header className="admin-review-header">
        <div>
          <p className="auth-eyebrow">Validação profissional</p>
          <h1 id="admin-interpreters-title">
            {view === "history" ? "Histórico de candidaturas" : "Candidaturas pendentes"}
          </h1>
        </div>
        {view === "pending" ? (
          <p
            className="pending-count"
            aria-label={`${pendingCount ?? 0} ${(pendingCount ?? 0) === 1 ? "pendente" : "pendentes"}`}
          >
            <strong>{pendingCount ?? 0}</strong>
            <span>{(pendingCount ?? 0) === 1 ? "pendente" : "pendentes"}</span>
          </p>
        ) : null}
      </header>

      <nav className="admin-review-tabs" aria-label="Visões de candidaturas">
        <Link
          className={
            view === "pending"
              ? "admin-review-tab admin-review-tab--active"
              : "admin-review-tab"
          }
          href="/app/admin/interpreters"
          aria-current={view === "pending" ? "page" : undefined}
        >
          Pendentes
          <span className="admin-review-tab__count">{pendingCount ?? 0}</span>
        </Link>
        <Link
          className={
            view === "history"
              ? "admin-review-tab admin-review-tab--active"
              : "admin-review-tab"
          }
          href="/app/admin/interpreters?view=history"
          aria-current={view === "history" ? "page" : undefined}
        >
          Histórico
        </Link>
      </nav>

      {view === "history" ? (
        <HistoryView />
      ) : (
        <PendingView />
      )}
    </section>
  );
}

async function PendingView() {
  const supabase = await createClient();

  const { data: applications, error: applicationsError } = await supabase
    .from("interpreter_applications")
    .select("id, profile_id, certificate_path, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (applicationsError) {
    return (
      <p className="admin-review-lead" role="alert">
        Recarregue a página em alguns instantes. Nenhuma candidatura foi
        alterada.
      </p>
    );
  }

  const pendingApplications = applications ?? [];
  const profileIds = [
    ...new Set(pendingApplications.map(({ profile_id }) => profile_id)),
  ];
  const { data: interpreterProfiles, error: interpreterProfilesError } =
    profileIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", profileIds)
      : { data: [], error: null };

  if (interpreterProfilesError) {
    return (
      <p className="admin-review-lead" role="alert">
        Recarregue a página para tentar novamente. Nenhuma candidatura foi
        alterada.
      </p>
    );
  }

  const namesByProfileId = new Map(
    (interpreterProfiles ?? []).map(({ id, full_name }) => [id, full_name]),
  );
  const reviewItems = await Promise.all(
    pendingApplications.map(async (application) => {
      const { data, error: signedUrlError } = await supabase.storage
        .from("certificates")
        .createSignedUrl(
          application.certificate_path,
          SIGNED_CERTIFICATE_TTL_SECONDS,
        );

      if (signedUrlError) {
        console.error("Não foi possível gerar URL assinada do certificado.", {
          code: signedUrlError.message,
          applicationId: application.id,
        });
      }

      return {
        id: application.id,
        interpreterName:
          namesByProfileId.get(application.profile_id)?.trim() ||
          "Intérprete sem nome informado",
        submittedAt: application.created_at,
        certificateUrl: data?.signedUrl ?? null,
      };
    }),
  );

  return (
    <>
      <p className="admin-review-lead">
        Confira o certificado antes de decidir. Links de documentos expiram em
        10 minutos e são gerados no servidor apenas para esta sessão
        administrativa.
      </p>

      {reviewItems.length > 0 ? (
        <div className="interpreter-review-list">
          {reviewItems.map((application) => (
            <InterpreterReviewCard
              key={application.id}
              application={application}
            />
          ))}
        </div>
      ) : (
        <div className="admin-review-empty">
          <span className="status-signal" aria-hidden="true" />
          <div>
            <h2>Fila em dia</h2>
            <p>Não há certificados aguardando análise neste momento.</p>
          </div>
        </div>
      )}
    </>
  );
}

async function HistoryView() {
  const supabase = await createClient();

  const { data: decisions, error: decisionsError } = await supabase
    .from("interpreter_applications")
    .select(
      "id, profile_id, status, rejection_reason, reviewed_by, reviewed_at, created_at",
    )
    .in("status", ["approved", "rejected"])
    .order("reviewed_at", { ascending: false })
    .limit(INTERPRETER_HISTORY_LIMIT);

  if (decisionsError) {
    return (
      <p className="admin-review-lead" role="alert">
        Não foi possível carregar o histórico. Recarregue a página em alguns
        instantes.
      </p>
    );
  }

  const historyItems = decisions ?? [];
  const profileIds = [
    ...new Set(
      historyItems.flatMap((item) =>
        [item.profile_id, item.reviewed_by].filter(
          (id): id is string => Boolean(id),
        ),
      ),
    ),
  ];

  const { data: people, error: peopleError } =
    profileIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", profileIds)
      : { data: [], error: null };

  if (peopleError) {
    return (
      <p className="admin-review-lead" role="alert">
        Não foi possível identificar os nomes do histórico. Recarregue a página.
      </p>
    );
  }

  const namesById = new Map(
    (people ?? []).map(({ id, full_name }) => [
      id,
      full_name.trim() || "Nome não informado",
    ]),
  );

  return (
    <>
      <p className="admin-review-lead">
        Decisões já tomadas sobre candidaturas. Mostra as{" "}
        {INTERPRETER_HISTORY_LIMIT} mais recentes.
      </p>

      {historyItems.length > 0 ? (
        <ul className="admin-application-history">
          {historyItems
            .filter(
              (
                item,
              ): item is typeof item & {
                status: "approved" | "rejected";
                reviewed_at: string;
              } =>
                (item.status === "approved" || item.status === "rejected") &&
                Boolean(item.reviewed_at),
            )
            .map((item) => (
              <li
                key={item.id}
                className={`admin-application-history__item admin-application-history__item--${item.status}`}
              >
                <div className="admin-application-history__main">
                  <p className="admin-application-history__name">
                    {namesById.get(item.profile_id) ?? "Intérprete sem nome"}
                  </p>
                  <time dateTime={item.reviewed_at}>
                    {dateFormatter.format(new Date(item.reviewed_at))}
                  </time>
                  <p className="admin-application-history__meta">
                    Revisado por{" "}
                    {item.reviewed_by
                      ? (namesById.get(item.reviewed_by) ?? "admin")
                      : "admin"}
                  </p>
                  {item.status === "rejected" && item.rejection_reason ? (
                    <p className="admin-application-history__reason">
                      Motivo: {item.rejection_reason}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`request-status-badge request-status-badge-${item.status}`}
                >
                  {applicationDecisionLabel(item.status)}
                </span>
              </li>
            ))}
        </ul>
      ) : (
        <div className="admin-review-empty">
          <span className="status-signal" aria-hidden="true" />
          <div>
            <h2>Sem histórico</h2>
            <p>Nenhuma decisão registrada ainda.</p>
          </div>
        </div>
      )}
    </>
  );
}
