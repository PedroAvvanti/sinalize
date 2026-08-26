const DEFAULT_JITSI_DOMAIN = "meet.jit.si";

export function getJitsiDomain(): string {
  const configured = process.env.NEXT_PUBLIC_JITSI_DOMAIN?.trim();
  return configured || DEFAULT_JITSI_DOMAIN;
}

/** meet.jit.si exige que alguém clique em “Eu sou o anfitrião”. */
export function requiresJitsiHostLogin(domain = getJitsiDomain()): boolean {
  return domain === DEFAULT_JITSI_DOMAIN || domain.endsWith(".jit.si");
}

export function getJitsiExternalApiUrl(domain = getJitsiDomain()): string {
  return `https://${domain}/external_api.js`;
}

export const JITSI_EMBED_CONFIG = {
  configOverwrite: {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    disableDeepLinking: true,
    prejoinPageEnabled: false,
    /** Só surte efeito em Jitsi self-hosted com auth anônima. */
    enableLobby: false,
    enableRecording: false,
    recordings: {
      disable: true,
    },
  },
  interfaceConfigOverwrite: {
    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
    SHOW_JITSI_WATERMARK: false,
    HIDE_DEEP_LINKING_LOGO: true,
  },
} as const;
