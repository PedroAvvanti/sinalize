import { describe, expect, it } from "vitest";

import {
  JITSI_EMBED_CONFIG,
  requiresJitsiHostLogin,
} from "../../src/lib/jitsi/config";

describe("JITSI_EMBED_CONFIG", () => {
  it("desliga lobby para salas self-hosted iniciarem sem anfitrião", () => {
    expect(JITSI_EMBED_CONFIG.configOverwrite.enableLobby).toBe(false);
  });
});

describe("requiresJitsiHostLogin", () => {
  it("marca meet.jit.si como exigindo anfitrião", () => {
    expect(requiresJitsiHostLogin("meet.jit.si")).toBe(true);
  });

  it("não exige anfitrião em domínio self-hosted", () => {
    expect(requiresJitsiHostLogin("meet.exemplo.com")).toBe(false);
  });
});
