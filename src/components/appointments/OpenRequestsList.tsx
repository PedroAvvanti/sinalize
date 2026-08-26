"use client";

import { useEffect, useState } from "react";

import { OpenRequestCard } from "@/components/appointments/OpenRequestCard";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

export type OpenAppointment = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  | "id"
  | "scheduled_at"
  | "duration_minutes"
  | "reason_code"
  | "reason_custom_title"
  | "reason_text"
>;

type OpenRequestsListProps = {
  initialAppointments: OpenAppointment[];
  initialError?: string;
};

const OPEN_APPOINTMENT_FIELDS =
  "id, scheduled_at, duration_minutes, reason_code, reason_custom_title, reason_text";

export function OpenRequestsList({
  initialAppointments,
  initialError,
}: OpenRequestsListProps) {
  const [supabase] = useState(createClient);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [realtimeError, setRealtimeError] = useState(initialError);

  useEffect(() => {
    let active = true;

    async function refreshOpenAppointments() {
      const { data, error } = await supabase
        .from("appointments")
        .select(OPEN_APPOINTMENT_FIELDS)
        .eq("status", "open")
        .order("scheduled_at", { ascending: true });

      if (!active) {
        return;
      }

      if (error) {
        setRealtimeError(
          "Não foi possível atualizar a fila. Recarregue a página.",
        );
        return;
      }

      setRealtimeError(undefined);
      setAppointments(data ?? []);
    }

    const channel = supabase
      .channel("open-appointments-queue")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
          filter: "status=eq.open",
        },
        refreshOpenAppointments,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
        },
        refreshOpenAppointments,
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  function removeAppointment(appointmentId: string) {
    setAppointments((current) =>
      current.filter((appointment) => appointment.id !== appointmentId),
    );
  }

  return (
    <div className="open-requests">
      {realtimeError ? (
        <p className="auth-error" role="alert">
          {realtimeError}
        </p>
      ) : null}

      {appointments.length === 0 ? (
        <div className="open-requests__empty" role="status">
          <h2>Nenhum pedido aguardando</h2>
          <p>Novos atendimentos aparecerão aqui automaticamente.</p>
        </div>
      ) : (
        <>
          <p className="open-requests__count" aria-live="polite">
            {appointments.length === 1
              ? "1 pedido na fila"
              : `${appointments.length} pedidos na fila`}
          </p>
          <ul className="open-requests__list">
            {appointments.map((appointment) => (
              <li key={appointment.id}>
                <OpenRequestCard
                  appointment={appointment}
                  onAccepted={removeAppointment}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
