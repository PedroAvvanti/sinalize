"use client";

import { useEffect, useRef, useState } from "react";

import {
  getJitsiDomain,
  getJitsiExternalApiUrl,
  JITSI_EMBED_CONFIG,
} from "@/lib/jitsi/config";

type JitsiMeetEmbedProps = {
  domain?: string;
  roomName: string;
  displayName: string;
};

async function loadJitsiScript(domain: string): Promise<void> {
  if (window.JitsiMeetExternalAPI) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[data-jitsi-external-api="${domain}"]`,
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("script-error")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = getJitsiExternalApiUrl(domain);
    script.async = true;
    script.dataset.jitsiExternalApi = domain;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("script-error"));
    document.body.appendChild(script);
  });
}

export function JitsiMeetEmbed({
  domain = getJitsiDomain(),
  roomName,
  displayName,
}: JitsiMeetEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ dispose: () => void } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let active = true;
    container.innerHTML = "";

    void (async () => {
      try {
        await loadJitsiScript(domain);

        if (!active || !window.JitsiMeetExternalAPI) {
          throw new Error("api-unavailable");
        }

        apiRef.current?.dispose();

        apiRef.current = new window.JitsiMeetExternalAPI(domain, {
          roomName,
          parentNode: container,
          userInfo: {
            displayName,
          },
          configOverwrite: JITSI_EMBED_CONFIG.configOverwrite,
          interfaceConfigOverwrite: JITSI_EMBED_CONFIG.interfaceConfigOverwrite,
        });
      } catch {
        if (active) {
          setLoadError("Não foi possível abrir a sala.");
        }
      }
    })();

    return () => {
      active = false;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [domain, roomName, displayName, retryKey]);

  if (loadError) {
    return (
      <div className="meeting-error" role="alert">
        <p>{loadError}</p>
        <button
          className="auth-submit"
          type="button"
          onClick={() => {
            setLoadError(null);
            setRetryKey((current) => current + 1);
          }}
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="jitsi-meeting-frame"
      aria-label={`Sala de videochamada ${roomName}`}
    />
  );
}
