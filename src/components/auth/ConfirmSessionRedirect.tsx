"use client";

import { useEffect, useRef } from "react";

const POLL_MS = 2000;

type SessionHomeResponse = {
  destination: string | null;
};

export function ConfirmSessionRedirect() {
  const redirecting = useRef(false);

  useEffect(() => {
    async function goHomeIfSignedIn() {
      if (redirecting.current) {
        return;
      }

      try {
        const response = await fetch("/auth/session-home", {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as SessionHomeResponse;

        if (!data.destination) {
          return;
        }

        redirecting.current = true;
        window.location.assign(data.destination);
      } catch {
        // Falhas transitórias de rede: o próximo poll tenta de novo.
      }
    }

    void goHomeIfSignedIn();

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
      window.removeEventListener("focus", goHomeIfSignedIn);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
