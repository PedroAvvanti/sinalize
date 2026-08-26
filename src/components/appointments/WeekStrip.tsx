"use client";

import type { Database } from "@/types/database";

export type WeekAppointment = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  "id" | "scheduled_at" | "status"
>;

type WeekStripProps = {
  appointments: WeekAppointment[];
  referenceDate?: Date;
  /** YYYY-MM-DD of selected day; null = show all. */
  selectedDayKey?: string | null;
  onSelectDay?: (dayKey: string | null) => void;
};

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const weekdayNarrowFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "narrow",
});
const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric" });

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diff);
  return start;
}

export function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function civilDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function WeekStrip({
  appointments,
  referenceDate = new Date(),
  selectedDayKey = null,
  onSelectDay,
}: WeekStripProps) {
  const weekStart = startOfWeek(referenceDate);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const interactive = typeof onSelectDay === "function";

  return (
    <section className="week-strip" aria-labelledby="week-strip-title">
      <div className="week-strip__header">
        <h2 id="week-strip-title">Esta semana</h2>
        {interactive && selectedDayKey ? (
          <button
            type="button"
            className="week-strip__clear"
            onClick={() => onSelectDay(null)}
          >
            Ver todos
          </button>
        ) : null}
      </div>
      <ol className="week-strip__days">
        {days.map((day) => {
          const dayKey = civilDayKey(day);
          const dayAppointments = appointments.filter((appointment) =>
            sameCalendarDay(new Date(appointment.scheduled_at), day),
          );
          const isToday = sameCalendarDay(day, referenceDate);
          const isSelected = selectedDayKey === dayKey;
          const shortLabel = weekdayFormatter.format(day).replace(".", "");
          const narrowLabel = weekdayNarrowFormatter.format(day);
          const className = [
            "week-strip__day",
            isToday ? "week-strip__day-today" : "",
            isSelected ? "week-strip__day-selected" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const content = (
            <>
              <span className="week-strip__weekday week-strip__weekday--short">
                {shortLabel}
              </span>
              <span
                className="week-strip__weekday week-strip__weekday--narrow"
                aria-hidden="true"
              >
                {narrowLabel}
              </span>
              <span className="week-strip__date">{dayFormatter.format(day)}</span>
              {dayAppointments.length > 0 ? (
                <span
                  className="week-strip__marker"
                  aria-label={`${dayAppointments.length} atendimento(s)`}
                >
                  {dayAppointments.length}
                </span>
              ) : (
                <span className="week-strip__marker week-strip__marker--empty" />
              )}
            </>
          );

          return (
            <li key={dayKey} className={className}>
              {interactive ? (
                <button
                  type="button"
                  className="week-strip__day-button"
                  aria-pressed={isSelected}
                  aria-label={`${shortLabel} ${dayFormatter.format(day)}${
                    dayAppointments.length > 0
                      ? `, ${dayAppointments.length} atendimento(s)`
                      : ""
                  }`}
                  onClick={() =>
                    onSelectDay(isSelected ? null : dayKey)
                  }
                >
                  {content}
                </button>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
