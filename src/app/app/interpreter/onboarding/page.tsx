import { redirect } from "next/navigation";

import { CertificateUpload } from "@/components/interpreters/CertificateUpload";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { resolveApplicationView } from "@/lib/interpreters/application";
import { createClient } from "@/lib/supabase/server";

export default async function InterpreterOnboardingPage() {
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

  if (profile.role !== "interpreter") {
    redirect(`/app/${profile.role}`);
  }

  const { data: application, error: applicationError } = await supabase
    .from("interpreter_applications")
    .select("status, rejection_reason, created_at")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (applicationError) {
    return (
      <section className="app-panel onboarding-panel" aria-labelledby="title">
        <p className="auth-eyebrow">Validação profissional</p>
        <h1 id="title">Não foi possível consultar sua candidatura</h1>
        <p className="onboarding-lead" role="alert">
          Tente recarregar esta página em alguns instantes. Nenhum novo envio
          foi solicitado.
        </p>
      </section>
    );
  }

  const view = resolveApplicationView(application?.status ?? null);

  if (view === "approved") {
    redirect("/app/interpreter");
  }

  return (
    <section className="app-panel onboarding-panel" aria-labelledby="title">
      <div className="onboarding-heading">
        <div>
          <p className="auth-eyebrow">Validação profissional</p>
          <h1 id="title">
            {view === "upload"
              ? "Confirme sua atuação em Libras"
              : view === "pending"
                ? "Seu certificado está em análise"
                : "Revise seu certificado"}
          </h1>
        </div>
        <ol className="application-steps" aria-label="Etapas da candidatura">
          <li data-active={view === "upload"}>Envio</li>
          <li data-active={view === "pending"}>Análise</li>
          <li>Aprovação</li>
        </ol>
      </div>

      {view === "upload" ? (
        <div className="onboarding-content">
          <p className="onboarding-lead">
            Para acessar a área do intérprete, envie um documento que comprove
            sua qualificação. O arquivo fica privado e será usado somente na
            análise da candidatura.
          </p>
          <CertificateUpload />
        </div>
      ) : null}

      {view === "pending" ? (
        <div className="application-status application-status-pending">
          <span className="status-signal" aria-hidden="true" />
          <div>
            <h2>Análise em andamento</h2>
            <p>
              Você não precisa enviar outro arquivo. Assim que a análise for
              concluída, o acesso à área do intérprete será liberado.
            </p>
          </div>
        </div>
      ) : null}

      {view === "rejected" ? (
        <div className="onboarding-content">
          <div className="application-status application-status-rejected">
            <span className="status-signal" aria-hidden="true" />
            <div>
              <h2>O certificado precisa ser reenviado</h2>
              <p>
                <strong>Motivo:</strong>{" "}
                {application?.rejection_reason ??
                  "O documento enviado não pôde ser validado."}
              </p>
            </div>
          </div>
          <CertificateUpload resubmission />
        </div>
      ) : null}
    </section>
  );
}
