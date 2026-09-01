"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { HistoryAppointment } from "@/components/appointments/AppointmentHistoryList";
import { AppointmentHistoryList } from "@/components/appointments/AppointmentHistoryList";
import { civilDayKey } from "@/components/appointments/WeekStrip";

type HistoryBoardProps = {
  appointments: HistoryAppointment[];
};

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "completed", label: "Concluídos" },
  { value: "cancelled", label: "Cancelados" },
  { value: "expired", label: "Expirados" },
] as const;

export function HistoryBoard({ appointments }: HistoryBoardProps) {
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]["value"]>("all");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesStatus =
        statusFilter === "all" || appointment.status === statusFilter;
      const matchesDate =
        !dateFilter ||
        civilDayKey(new Date(appointment.scheduled_at)) === dateFilter;

      return matchesStatus && matchesDate;
    });
  }, [appointments, statusFilter, dateFilter]);

  return (
    <div className="history-board">
      <div className="history-filters" role="search" aria-label="Filtrar histórico">
        <div className="history-filters__group">
          <label htmlFor="history-status-filter">Status</label>
          <select
            id="history-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as (typeof STATUS_OPTIONS)[number]["value"],
              )
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="history-filters__group">
          <label htmlFor="history-date-filter">Data</label>
          <input
            id="history-date-filter"
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />
        </div>

        {statusFilter !== "all" || dateFilter ? (
          <button
            className="history-filters__clear"
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setDateFilter("");
            }}
          >
            Limpar filtros
          </button>
        ) : null}
      </div>

      <p className="history-filters__count" role="status">
        {filtered.length === 1
          ? "1 atendimento encontrado"
          : `${filtered.length} atendimentos encontrados`}
      </p>

      <AppointmentHistoryList
        appointments={filtered}
        emptyTitle="Nenhum atendimento com esses filtros"
        emptyDescription="Tente outro status ou data."
        showReviewLink
      />
    </div>
  );
}
