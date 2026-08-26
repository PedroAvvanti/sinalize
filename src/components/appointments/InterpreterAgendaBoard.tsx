"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  WeekStrip,
  civilDayKey,
  type WeekAppointment,
} from "@/components/appointments/WeekStrip";
import { appointmentReasonDisplayLabel } from "@/lib/domain/reasons";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeStyle: "short",
});

export type AgendaBoardAppointment = {
  id: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  reason_code: string;
  reason_custom_title: string | null;
  requester_name: string;
  can_enter: boolean;
};

type InterpreterAgendaBoardProps = {
  appointments: AgendaBoardAppointment[];
  weekAppointments: WeekAppointment[];
  referenceIso: string;
  loadError?: boolean;
};

export function InterpreterAgendaBoard({
  appointments,
  weekAppointments,
  referenceIso,
  loadError = false,
}: InterpreterAgendaBoardProps) {
  const referenceDate = useMemo(() => new Date(referenceIso), [referenceIso]);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!selectedDayKey) {
      return appointments;
    }
    return appointments.filter(
      (appointment) =>
        civilDayKey(new Date(appointment.scheduled_at)) === selectedDayKey,
    );
  }, [appointments, selectedDayKey]);

  const nextId = appointments[0]?.id;

  const selectedLabel = selectedDayKey
    ? dateFormatter.format(
        new Date(`${selectedDayKey}T12:00:00`),
      )
    : null;

  return (
    <>
      <WeekStrip
        appointments={weekAppointments}
        referenceDate={referenceDate}
        selectedDayKey={selectedDayKey}
        onSelectDay={setSelectedDayKey}
      />

      {loadError ? (
        <p className="user-dashboard-error" role="alert">
          Não foi possível carregar a agenda. Recarregue a página.
        </p>
      ) : appointments.length === 0 ? (
        <div className="agenda-desk__empty" role="status">
          <h2>Nada confirmado ainda</h2>
          <p>
            Quando você aceitar um pedido, ele aparece aqui na linha do tempo.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="agenda-desk__empty" role="status">
          <h2>Nenhum atendimento neste dia</h2>
          <p>
            {selectedLabel
              ? `Nada marcado para ${selectedLabel}. Toque em outro dia ou em “Ver todos”.`
              : "Toque em outro dia ou em “Ver todos”."}
          </p>
        </div>
      ) : (
        <ol className="agenda-clock" aria-labelledby="agenda-title">
          {filtered.map((appointment) => {
            const scheduledAt = new Date(appointment.scheduled_at);
            const isNext = appointment.id === nextId;

            return (
              <li
                key={appointment.id}
                className={
                  isNext
                    ? "agenda-clock__item agenda-clock__item--next"
                    : "agenda-clock__item"
                }
              >
                <div className="agenda-clock__time" aria-hidden="true">
                  <span>{timeFormatter.format(scheduledAt)}</span>
                  <i />
                </div>
                <article className="agenda-clock__card">
                  {isNext ? (
                    <p className="agenda-clock__badge">Próximo</p>
                  ) : null}
                  <h2>{appointment.requester_name}</h2>
                  <p className="agenda-clock__reason">
                    {appointmentReasonDisplayLabel(
                      appointment.reason_code,
                      appointment.reason_custom_title,
                    )}
                  </p>
                  <time dateTime={appointment.scheduled_at}>
                    {dateFormatter.format(scheduledAt)}
                  </time>
                  <p className="agenda-clock__duration">
                    {appointment.duration_minutes} minutos
                  </p>
                  {appointment.status === "cancel_requested" ? (
                    <span className="request-status-badge request-status-badge-cancel_requested">
                      Cancelamento em análise
                    </span>
                  ) : null}
                  {appointment.can_enter ? (
                    <Link
                      className="user-request-link agenda-clock__enter"
                      href={`/app/meeting/${appointment.id}`}
                    >
                      Entrar na chamada <span aria-hidden="true">→</span>
                    </Link>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
