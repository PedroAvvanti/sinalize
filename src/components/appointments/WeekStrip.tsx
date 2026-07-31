import type { Database } from "@/types/database";

export type WeekAppointment = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  "id" | "scheduled_at" | "status"
>;

type WeekStripProps = {
  appointments: WeekAppointment[];
  referenceDate?: Date;
};

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric" });

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diff);
  return start;
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function WeekStrip({
  appointments,
  referenceDate = new Date(),
}: WeekStripProps) {
  const weekStart = startOfWeek(referenceDate);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  return (
    <section className="week-strip" aria-labelledby="week-strip-title">
      <div className="week-strip__header">
        <h2 id="week-strip-title">Esta semana</h2>
        <p>Seus atendimentos nos próximos dias</p>
      </div>
      <ol className="week-strip__days">
        {days.map((day) => {
          const dayAppointments = appointments.filter((appointment) =>
            sameCalendarDay(new Date(appointment.scheduled_at), day),
          );
          const isToday = sameCalendarDay(day, referenceDate);

          return (
            <li
              key={day.toISOString()}
              className={isToday ? "week-strip__day week-strip__day-today" : "week-strip__day"}
            >
              <span className="week-strip__weekday">
                {weekdayFormatter.format(day)}
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
                <span className="week-strip__marker week-strip__marker-empty" aria-hidden="true">
                  ·
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
