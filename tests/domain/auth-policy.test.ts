import { describe, expect, it } from "vitest";

import {
  authMessageFor,
  isProfileRecoveryRequest,
  loginMessageForError,
  profileUnavailableLoginPath,
  resolvePostLoginPath,
  validateSignupEligibility,
} from "../../src/lib/auth/policy";

describe("resolvePostLoginPath", () => {
  it("mantém um destino relativo no namespace do papel", () => {
    expect(resolvePostLoginPath("/app/user/agendamentos?status=open", "user")).toBe(
      "/app/user/agendamentos?status=open",
    );
    expect(resolvePostLoginPath("/app/interpreter/agenda", "interpreter")).toBe(
      "/app/interpreter/agenda",
    );
    expect(resolvePostLoginPath("/app/admin/revisoes", "admin")).toBe(
      "/app/admin/revisoes",
    );
  });

  it("usa a home quando o namespace não corresponde ao papel", () => {
    expect(resolvePostLoginPath("/app/admin", "user")).toBe("/app/user");
    expect(resolvePostLoginPath("/app/user", "interpreter")).toBe(
      "/app/interpreter",
    );
  });

  it.each([
    "https://example.com/app/user",
    "//example.com/app/user",
    "/app/user\\config",
    "/app/user//example.com",
    "/app/user/../admin",
    "/app/user/%2e%2e/admin",
    "/app/user/%252e%252e/admin",
    "/app/user?return=%2F%2Fevil.example",
    "/login",
    "app/user",
  ])("rejeita destino inseguro %s", (nextPath) => {
    expect(resolvePostLoginPath(nextPath, "user")).toBe("/app/user");
  });
});

describe("validateSignupEligibility", () => {
  it("rejeita cadastro de menor de idade", () => {
    expect(validateSignupEligibility("user", false)).toEqual({
      ok: false,
      error: "É preciso ter 18 anos ou mais.",
    });
  });

  it("rejeita admin no cadastro público", () => {
    expect(validateSignupEligibility("admin", true)).toEqual({
      ok: false,
      error: "Escolha um tipo de conta válido.",
    });
  });

  it("aceita somente os papéis públicos para adultos", () => {
    expect(validateSignupEligibility("user", true)).toEqual({
      ok: true,
      role: "user",
    });
    expect(validateSignupEligibility("interpreter", true)).toEqual({
      ok: true,
      role: "interpreter",
    });
  });
});

describe("mensagens públicas de autenticação", () => {
  it("não expõe o erro interno do provedor no cadastro", () => {
    expect(authMessageFor("signup_failed")).toBe(
      "Não foi possível criar sua conta. Tente novamente mais tarde.",
    );
  });

  it("oferece recuperação segura quando o perfil está ausente", () => {
    expect(profileUnavailableLoginPath()).toBe(
      "/login?error=profile_unavailable",
    );
    expect(loginMessageForError("profile_unavailable")).toBe(
      "Sua sessão foi encerrada. Entre novamente ou crie uma conta para continuar.",
    );
    expect(loginMessageForError("erro-arbitrario")).toBeNull();
    expect(
      isProfileRecoveryRequest("/login", "profile_unavailable"),
    ).toBe(true);
    expect(isProfileRecoveryRequest("/login", "erro-arbitrario")).toBe(false);
    expect(
      isProfileRecoveryRequest("/app/user", "profile_unavailable"),
    ).toBe(false);
  });
});
