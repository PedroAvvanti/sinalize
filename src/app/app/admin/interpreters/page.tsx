import { redirect } from "next/navigation";

import { InterpreterReviewCard } from "@/components/admin/InterpreterReviewCard";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { createClient } from "@/lib/supabase/server";

const SIGNED_CERTIFICATE_TTL_SECONDS = 10 * 60;

export default async function AdminInterpretersPage() {
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

  const { data: applications, error: applicationsError } = await supabase
    .from("interpreter_applications")
    .select("id, profile_id, certificate_path, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (applicationsError) {
    return (
      <section
        className="app-panel admin-review-page"
        aria-labelledby="admin-interpreters-title"
      >
        <p className="auth-eyebrow">Validação profissional</p>
        <h1 id="admin-interpreters-title">Não foi possível carregar a fila</h1>
        <p className="admin-review-lead" role="alert">
          Recarregue a página em alguns instantes. Nenhuma candidatura foi
          alterada.
        </p>
      </section>
    );
  }

  const profileIds = [...new Set(applications.map(({ profile_id }) => profile_id))];
  const { data: interpreterProfiles, error: interpreterProfilesError } =
    profileIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", profileIds)
      : { data: [], error: null };

  if (interpreterProfilesError) {
    return (
      <section
        className="app-panel admin-review-page"
        aria-labelledby="admin-interpreters-title"
      >
        <p className="auth-eyebrow">Validação profissional</p>
        <h1 id="admin-interpreters-title">
          Não foi possível identificar os candidatos
        </h1>
        <p className="admin-review-lead" role="alert">
          Recarregue a página para tentar novamente. Nenhuma candidatura foi
          alterada.
        </p>
      </section>
    );
  }

  const namesByProfileId = new Map(
    interpreterProfiles.map(({ id, full_name }) => [id, full_name]),
  );
  const reviewItems = await Promise.all(
    applications.map(async (application) => {
      const { data } = await supabase.storage
        .from("certificates")
        .createSignedUrl(
          application.certificate_path,
          SIGNED_CERTIFICATE_TTL_SECONDS,
        );

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
    <section
      className="app-panel admin-review-page"
      aria-labelledby="admin-interpreters-title"
    >
      <header className="admin-review-header">
        <div>
          <p className="auth-eyebrow">Validação profissional</p>
          <h1 id="admin-interpreters-title">Candidaturas pendentes</h1>
        </div>
        <p
          className="pending-count"
          aria-label={`${reviewItems.length} pendentes`}
        >
          <strong>{reviewItems.length}</strong>
          <span>{reviewItems.length === 1 ? "pendente" : "pendentes"}</span>
        </p>
      </header>

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
    </section>
  );
}
