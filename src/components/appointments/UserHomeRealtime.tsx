"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  NextCallHero,
  type NextCallAppointment,
} from "@/components/appointments/NextCallHero";
import {
  RequestStatusList,
  type RequestStatusItem,
} from "@/components/appointments/RequestStatusList";
import {
  WeekStrip,
  type WeekAppointment,
} from "@/components/appointments/WeekStrip";
import { EmptyState } from "@/components/ui/EmptyState";
import { isUpcomingAppointment } from "@/lib/domain/meeting-access";
import {
  appointmentBecameAccepted,
  pickNextCall,
} from "@/lib/domain/user-home";
import { createClient } from "@/lib/supabase/client";

const ACTIVE_STATUSES = ["open", "accepted", "cancel_requested"] as const;

const ACTIVE_FIELDS =
  "id, status, scheduled_at, duration_minutes, reason_code, reason_custom_title, reason_text";
const WEEK_FIELDS = "id, scheduled_at, status";
const RECENT_FIELDS =
  "id, status, scheduled_at, duration_minutes, reason_code, reason_custom_title";

type UserHomeRealtimeProps = {
  userId: string;
  requesterName: string;
  initialActive: NextCallAppointment[];
  initialWeek: WeekAppointment[];
  initialRecent: RequestStatusItem[];
};

export function UserHomeRealtime({
  userId,
  requesterName,
  initialActive,
  initialWeek,
  initialRecent,
}: UserHomeRealtimeProps) {
  const [supabase] = useState(createClient);
  const [activeAppointments, setActiveAppointments] = useState(initialActive);
  const [weekAppointments, setWeekAppointments] = useState(initialWeek);
  const [recentAppointments, setRecentAppointments] = useState(initialRecent);
  const [acceptedToast, setAcceptedToast] = useState(false);
  const previousActiveRef = useRef(initialActive);

  useEffect(() => {
    if (!acceptedToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAcceptedToast(false);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [acceptedToast]);

  useEffect(() => {
    let active = true;

    async function refreshAppointments() {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const [activeResult, weekResult, recentResult] = await Promise.all([
        supabase
          .from("appointments")
          .select(ACTIVE_FIELDS)
          .eq("requester_id", userId)
          .in("status", ACTIVE_STATUSES)
          .order("scheduled_at", { ascending: true }),
        supabase
          .from("appointments")
          .select(WEEK_FIELDS)
          .eq("requester_id", userId)
          .gte("scheduled_at", weekStart.toISOString())
          .lt("scheduled_at", weekEnd.toISOString())
          .order("scheduled_at", { ascending: true }),
        supabase
          .from("appointments")
          .select(RECENT_FIELDS)
          .eq("requester_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (!active) {
        return;
      }

      if (activeResult.error || weekResult.error || recentResult.error) {
        return;
      }

      const nextActive = (activeResult.data ?? []) as NextCallAppointment[];
      const nextRecent = (recentResult.data ?? []) as RequestStatusItem[];

      if (appointmentBecameAccepted(previousActiveRef.current, nextActive)) {
        setAcceptedToast(true);
      }

      previousActiveRef.current = nextActive;
      setActiveAppointments(nextActive);
      setWeekAppointments((weekResult.data ?? []) as WeekAppointment[]);
      setRecentAppointments(nextRecent);
    }

    const channel = supabase
      .channel(`user-home-appointments-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `requester_id=eq.${userId}`,
        },
        () => {
          void refreshAppointments();
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const now = new Date();
  const nextCall = pickNextCall(activeAppointments, now);
  const hasAnyUpcoming = activeAppointments.some((appointment) =>
    isUpcomingAppointment(
      new Date(appointment.scheduled_at),
      appointment.duration_minutes,
      now,
    ),
  );

  return (
    <div className="user-dashboard">
      {acceptedToast ? (
        <p className="user-home-toast" role="status" aria-live="polite">
          Intérprete aceitou seu pedido
        </p>
      ) : null}

      <NextCallHero appointment={nextCall} requesterName={requesterName} />

      <WeekStrip appointments={weekAppointments} referenceDate={now} />

      {!hasAnyUpcoming ? (
        <EmptyState
          title="Nenhuma chamada agendada"
          description="Solicite um intérprete quando precisar de apoio em Libras."
          action={
            <Link className="user-request-link" href="/app/user/request">
              Solicitar intérprete <span aria-hidden="true">→</span>
            </Link>
          }
        />
      ) : null}

      <RequestStatusList appointments={recentAppointments} />
    </div>
  );
}
