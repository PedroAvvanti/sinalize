"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  NextCallHero,
  type NextCallAppointment,
} from "@/components/appointments/NextCallHero";
import {
  PendingReviewBanner,
  type PendingReview,
} from "@/components/appointments/PendingReviewBanner";
import {
  RequestStatusList,
  type RequestStatusItem,
} from "@/components/appointments/RequestStatusList";
import {
  WeekStrip,
  type WeekAppointment,
  civilDayKey,
} from "@/components/appointments/WeekStrip";
import { isWithinMeetingWindow, isUpcomingAppointment } from "@/lib/domain/meeting-access";
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

type AcceptedToastState = {
  appointmentId: string;
  canEnter: boolean;
} | null;

type UserHomeRealtimeProps = {
  userId: string;
  requesterName: string;
  initialActive: NextCallAppointment[];
  initialWeek: WeekAppointment[];
  initialRecent: RequestStatusItem[];
  pendingReview?: PendingReview | null;
};

export function UserHomeRealtime({
  userId,
  requesterName,
  initialActive,
  initialWeek,
  initialRecent,
  pendingReview = null,
}: UserHomeRealtimeProps) {
  const [supabase] = useState(createClient);
  const [activeAppointments, setActiveAppointments] = useState(initialActive);
  const [weekAppointments, setWeekAppointments] = useState(initialWeek);
  const [recentAppointments, setRecentAppointments] = useState(initialRecent);
  const [acceptedToast, setAcceptedToast] = useState<AcceptedToastState>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const previousActiveRef = useRef(initialActive);

  useEffect(() => {
    if (!acceptedToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAcceptedToast(null);
    }, 8000);

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
        setRefreshError(
          "Não foi possível atualizar seus atendimentos. Recarregue a página.",
        );
        return;
      }

      setRefreshError(null);

      const nextActive = (activeResult.data ?? []) as NextCallAppointment[];
      const nextRecent = (recentResult.data ?? []) as RequestStatusItem[];

      if (appointmentBecameAccepted(previousActiveRef.current, nextActive)) {
        const accepted = nextActive.find(
          (appointment) => appointment.status === "accepted",
        );

        if (accepted) {
          const canEnter = isWithinMeetingWindow(
            new Date(accepted.scheduled_at),
            accepted.duration_minutes,
          );
          setAcceptedToast({
            appointmentId: accepted.id,
            canEnter,
          });
        }
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

  const filteredRecent = selectedDayKey
    ? recentAppointments.filter(
        (appointment) =>
          civilDayKey(new Date(appointment.scheduled_at)) === selectedDayKey,
      )
    : recentAppointments;

  return (
    <div className="user-dashboard">
      {refreshError ? (
        <p className="user-dashboard-error" role="alert">
          {refreshError}
        </p>
      ) : null}

      {acceptedToast ? (
        <div className="user-home-toast" role="status" aria-live="polite">
          <p>Intérprete aceitou seu pedido.</p>
          <div className="user-home-toast__actions">
            {acceptedToast.canEnter ? (
              <Link
                className="user-home-toast__link"
                href={`/app/meeting/${acceptedToast.appointmentId}`}
              >
                Entrar na chamada
              </Link>
            ) : (
              <Link
                className="user-home-toast__link"
                href="/app/user"
              >
                Ver detalhes
              </Link>
            )}
          </div>
        </div>
      ) : null}

      {pendingReview ? (
        <PendingReviewBanner appointment={pendingReview} />
      ) : null}

      <NextCallHero appointment={nextCall} requesterName={requesterName} />

      <WeekStrip
        appointments={weekAppointments}
        referenceDate={now}
        selectedDayKey={selectedDayKey}
        onSelectDay={setSelectedDayKey}
      />

      <RequestStatusList
        appointments={filteredRecent}
        emptyMessage={
          selectedDayKey
            ? "Nenhum pedido recente neste dia."
            : undefined
        }
      />
    </div>
  );
}
