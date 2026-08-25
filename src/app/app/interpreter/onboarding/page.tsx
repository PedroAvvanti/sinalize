import { redirect } from "next/navigation";

import { CertificateUpload } from "@/components/interpreters/CertificateUpload";
import { LivePulse } from "@/components/interpreters/LivePulse";
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
    .select("role, full_name")
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
      <div className="interpreter-desk">
        <section
          className="interpreter-hero interpreter-hero--compact"
          aria-labelledby="title"
        >
          <LivePulse />
          <div className="interpreter-hero__copy">
            <p className="auth-eyebrow">Validação profissional</p>
            <h1 id="title" className="interpreter-hero__title">
              Não foi possível consultar sua candidatura
            </h1>
            <p className="interpreter-hero__lead" role="alert">
              Tente recarregar esta página em alguns instantes. Nenhum novo
              envio foi solicitado.
            </p>
          </div>
        </section>
      </div>
    );
  }

  const view = resolveApplicationView(application?.status ?? null);

  if (view === "approved") {
    redirect("/app/interpreter");
  }

  const titles = {
    upload: "Confirme sua atuação em Libras",
    pending: "Seu certificado está em análise",
    rejected: "Revise seu certificado",
  } as const;

  const leads = {
    upload:
      "Envie um documento que comprove sua qualificação. O arquivo fica privado e só é usado na análise.",
    pending:
      "Você não precisa enviar outro arquivo. Assim que a análise terminar, a área do intérprete libera.",
    rejected:
      "O documento enviado não pôde ser validado. Ajuste e reenvie para continuar.",
  } as const;

  const stepIndex = view === "upload" ? 0 : view === "pending" ? 1 : 1;

  return (
    <div className="interpreter-desk">
      <section
        className="interpreter-hero interpreter-hero--compact"
        aria-labelledby="title"
      >
        <LivePulse />
        <div className="interpreter-hero__copy">
          <p className="auth-eyebrow">Validação profissional</p>
          <h1 id="title" className="interpreter-hero__title">
            {titles[view]}
          </h1>
          <p className="interpreter-hero__lead">{leads[view]}</p>
        </div>
      </section>

      <ol className="application-rail" aria-label="Etapas da candidatura">
        <li data-state={stepIndex === 0 ? "current" : "done"}>
          <span className="application-rail__index" aria-hidden="true">
            1
          </span>
          <span>Envio</span>
        </li>
        <li
          data-state={
            stepIndex === 1
              ? view === "rejected"
                ? "attention"
                : "current"
              : stepIndex > 1
                ? "done"
                : "todo"
          }
        >
          <span className="application-rail__index" aria-hidden="true">
            2
          </span>
          <span>Análise</span>
        </li>
        <li data-state="todo">
          <span className="application-rail__index" aria-hidden="true">
            3
          </span>
          <span>Aprovação</span>
        </li>
      </ol>

      {view === "upload" ? (
        <div className="onboarding-stage">
          <CertificateUpload />
        </div>
      ) : null}

      {view === "pending" ? (
        <div className="application-signal application-signal--pending">
          <span className="application-signal__pulse" aria-hidden="true" />
          <div>
            <h2>Análise em andamento</h2>
            <p>
              Fique de olho nas notificações. Assim que a equipe concluir a
              revisão, o acesso será liberado automaticamente.
            </p>
          </div>
        </div>
      ) : null}

      {view === "rejected" ? (
        <div className="onboarding-stage">
          <div className="application-signal application-signal--rejected">
            <span className="application-signal__mark" aria-hidden="true">
              !
            </span>
            <div>
              <h2>Reenvio necessário</h2>
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
    </div>
  );
}
