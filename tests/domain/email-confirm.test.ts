import { describe, expect, it } from "vitest";

import {
  parseEmailConfirmParams,
  resolveEmailConfirmDestination,
} from "../../src/lib/auth/email-confirm";

describe("parseEmailConfirmParams", () => {
  it("prioriza token_hash quando presente", () => {
    const params = new URLSearchParams({
      token_hash: "abc",
      type: "signup",
      code: "should-ignore",
    });

    expect(parseEmailConfirmParams(params)).toEqual({
      kind: "token_hash",
      token_hash: "abc",
      type: "signup",
    });
  });

  it("aceita code PKCE", () => {
    const params = new URLSearchParams({ code: "pkce-code" });

    expect(parseEmailConfirmParams(params)).toEqual({
      kind: "code",
      code: "pkce-code",
    });
  });

  it("rejeita ausência de credencial", () => {
    expect(parseEmailConfirmParams(new URLSearchParams())).toEqual({
      kind: "invalid",
    });
  });

  it("rejeita token_hash sem type", () => {
    expect(
      parseEmailConfirmParams(new URLSearchParams({ token_hash: "abc" })),
    ).toEqual({ kind: "invalid" });
  });
});

describe("resolveEmailConfirmDestination", () => {
  it("usa a home do papel quando autenticado", () => {
    expect(resolveEmailConfirmDestination("user", false)).toBe("/app/user");
    expect(resolveEmailConfirmDestination("interpreter", false)).toBe(
      "/app/interpreter",
    );
  });

  it("cai em /app quando o perfil ainda é indeterminado", () => {
    expect(resolveEmailConfirmDestination(null, true)).toBe("/app");
  });

  it("recupera com logout path quando o perfil é inválido", () => {
    expect(resolveEmailConfirmDestination(null, false)).toBe(
      "/login?error=profile_unavailable",
    );
  });
});
