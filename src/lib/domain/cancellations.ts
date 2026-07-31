const SAO_PAULO = "America/Sao_Paulo";

const civilDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SAO_PAULO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function civilDateInSaoPaulo(date: Date): string {
  return civilDateFormatter.format(date);
}

/** Usuário cancela direto se a data civil atual em SP for anterior à do agendamento. */
export function canUserCancelDirectly(
  scheduledAt: Date,
  now: Date = new Date(),
): boolean {
  return (
    civilDateInSaoPaulo(now) < civilDateInSaoPaulo(scheduledAt)
  );
}

export function directCancelMessage(): string {
  return "Seu atendimento foi cancelado.";
}

export function cancelRequestMessage(): string {
  return "Solicitação de cancelamento enviada para análise.";
}
