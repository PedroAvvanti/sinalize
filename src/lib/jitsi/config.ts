const DEFAULT_JITSI_DOMAIN = "meet.jit.si";

export function getJitsiDomain(): string {
  const configured = process.env.NEXT_PUBLIC_JITSI_DOMAIN?.trim();
  return configured || DEFAULT_JITSI_DOMAIN;
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
