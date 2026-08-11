"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { decideProfileAccess } from "@/lib/auth/policy";
import { createClient } from "@/lib/supabase/client";

const POLL_MS = 2000;

export function ConfirmSessionRedirect() {
  const router = useRouter();
  const redirecting = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    async function goHomeIfSignedIn() {
      if (redirecting.current) {
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      const access = decideProfileAccess(profile?.role, Boolean(profileError));

      if (access.kind !== "authenticated") {
        return;
      }

      redirecting.current = true;
      router.replace(access.destination);
    }

    void goHomeIfSignedIn();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        void goHomeIfSignedIn();
      }
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void goHomeIfSignedIn();
      }
    };

    window.addEventListener("focus", goHomeIfSignedIn);
    document.addEventListener("visibilitychange", onVisible);
    const intervalId = window.setInterval(() => {
      void goHomeIfSignedIn();
    }, POLL_MS);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", goHomeIfSignedIn);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(intervalId);
    };
  }, [router]);

  return null;
}
