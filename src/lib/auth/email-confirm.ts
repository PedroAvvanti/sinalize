import type { EmailOtpType } from "@supabase/supabase-js";

import { decideProfileAccess } from "./policy";

export type EmailConfirmParams =
  | { kind: "token_hash"; token_hash: string; type: EmailOtpType }
  | { kind: "code"; code: string }
  | { kind: "invalid" };

const EMAIL_OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function isEmailOtpType(value: string): value is EmailOtpType {
  return EMAIL_OTP_TYPES.has(value);
}

export function parseEmailConfirmParams(
  params: URLSearchParams,
): EmailConfirmParams {
  const tokenHash = params.get("token_hash");
  const type = params.get("type");

  if (tokenHash && type && isEmailOtpType(type)) {
    return { kind: "token_hash", token_hash: tokenHash, type };
  }

  const code = params.get("code");
  if (code) {
    return { kind: "code", code };
  }

  return { kind: "invalid" };
}

export function resolveEmailConfirmDestination(
  role: unknown,
  lookupFailed: boolean,
): string {
  const access = decideProfileAccess(role, lookupFailed);

  if (access.kind === "authenticated") {
    return access.destination;
  }

  if (access.kind === "recover") {
    return access.destination;
  }

  return "/app";
}
