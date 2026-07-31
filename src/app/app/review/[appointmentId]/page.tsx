import Link from "next/link";
import { redirect } from "next/navigation";

import { ReviewForm } from "@/components/reviews/ReviewForm";
import { profileUnavailableLoginPath } from "@/lib/auth/policy";
import { createClient } from "@/lib/supabase/server";

type ReviewPageProps = {
  params: Promise<{ appointmentId: string }>;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { appointmentId } = await params;
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

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, status, requester_id, interpreter_id")
    .eq("id", appointmentId)
    .maybeSingle();

  if (appointmentError || !appointment) {
    return (
      <section className="app-panel review-page" aria-labelledby="review-title">
        <h1 id="review-title">Atendimento não encontrado</h1>
        <p className="review-page__lead" role="alert">
          Verifique o link recebido ou volte ao início.
        </p>
        <Link className="next-call-secondary" href={`/app/${profile.role}`}>
          Voltar ao início
        </Link>
      </section>
    );
  }

  const isRequester = appointment.requester_id === userId;
  const isInterpreter = appointment.interpreter_id === userId;

  if (!isRequester && !isInterpreter) {
    return (
      <section className="app-panel review-page" aria-labelledby="review-title">
        <h1 id="review-title">Acesso negado</h1>
        <p className="review-page__lead" role="alert">
          Apenas participantes podem avaliar este atendimento.
        </p>
        <Link className="next-call-secondary" href={`/app/${profile.role}`}>
          Voltar ao início
        </Link>
      </section>
    );
  }

  if (appointment.status !== "completed") {
    return (
      <section className="app-panel review-page" aria-labelledby="review-title">
        <h1 id="review-title">Avaliação indisponível</h1>
        <p className="review-page__lead" role="alert">
          Este atendimento ainda não foi concluído.
        </p>
        <Link className="next-call-secondary" href={`/app/${profile.role}`}>
          Voltar ao início
        </Link>
      </section>
    );
  }

  const recipientId = isRequester
    ? appointment.interpreter_id
    : appointment.requester_id;

  if (!recipientId) {
    return (
      <section className="app-panel review-page" aria-labelledby="review-title">
        <h1 id="review-title">Avaliação indisponível</h1>
        <p className="review-page__lead" role="alert">
          Não encontramos o participante para avaliar.
        </p>
        <Link className="next-call-secondary" href={`/app/${profile.role}`}>
          Voltar ao início
        </Link>
      </section>
    );
  }

  const [{ data: recipient, error: recipientError }, { data: existingReview }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", recipientId)
        .single(),
      supabase
        .from("reviews")
        .select("id")
        .eq("appointment_id", appointmentId)
        .eq("from_profile_id", userId)
        .maybeSingle(),
    ]);

  const homeHref = `/app/${profile.role}`;

  if (existingReview) {
    return (
      <section className="app-panel review-page" aria-labelledby="review-title">
        <p className="auth-eyebrow">Avaliação</p>
        <h1 id="review-title">Obrigado</h1>
        <p className="review-page__lead" role="status">
          Você já enviou sua avaliação para este atendimento.
        </p>
        <Link className="user-request-link" href={homeHref}>
          Voltar ao início <span aria-hidden="true">→</span>
        </Link>
      </section>
    );
  }

  if (recipientError || !recipient) {
    return (
      <section className="app-panel review-page" aria-labelledby="review-title">
        <h1 id="review-title">Não foi possível carregar a avaliação</h1>
        <p className="review-page__lead" role="alert">
          Recarregue a página em alguns instantes.
        </p>
        <Link className="next-call-secondary" href={homeHref}>
          Voltar ao início
        </Link>
      </section>
    );
  }

  return (
    <section className="app-panel review-page" aria-labelledby="review-title">
      <header className="review-page__header">
        <p className="auth-eyebrow">Avaliação</p>
        <h1 id="review-title">Como foi o atendimento?</h1>
        <p className="review-page__lead">
          Sua nota atualiza a média pública do participante. Comentários são
          privados.
        </p>
      </header>

      <ReviewForm
        appointmentId={appointmentId}
        toProfileId={recipientId}
        recipientName={recipient.full_name}
        homeHref={homeHref}
      />
    </section>
  );
}
