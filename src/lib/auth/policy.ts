import { homePathForRole, type ProfileRole } from "./roles";

type AuthMessageCode =
  | "adult_required"
  | "invalid_public_role"
  | "profile_unavailable"
  | "signup_failed";

const AUTH_MESSAGES: Record<AuthMessageCode, string> = {
  adult_required: "É preciso ter 18 anos ou mais.",
  invalid_public_role: "Escolha um tipo de conta válido.",
  profile_unavailable:
    "Sua sessão foi encerrada. Entre novamente ou crie uma conta para continuar.",
  signup_failed:
    "Não foi possível criar sua conta. Tente novamente mais tarde.",
};

const PROFILE_UNAVAILABLE_ERROR = "profile_unavailable";

function isProfileRole(role: unknown): role is ProfileRole {
  return role === "user" || role === "interpreter" || role === "admin";
}

export function authMessageFor(code: AuthMessageCode): string {
  return AUTH_MESSAGES[code];
}

export function validateSignupEligibility(
  role: string,
  isAdult: boolean,
):
  | { ok: true; role: Exclude<ProfileRole, "admin"> }
  | { ok: false; error: string } {
  if (!isAdult) {
    return { ok: false, error: authMessageFor("adult_required") };
  }

  if (role !== "user" && role !== "interpreter") {
    return { ok: false, error: authMessageFor("invalid_public_role") };
  }

  return { ok: true, role };
}

export function resolvePostLoginPath(
  nextPath: string,
  role: ProfileRole,
): string {
  const homePath = homePathForRole(role);

  if (
    !nextPath.startsWith("/app/") ||
    nextPath.length > 2048 ||
    nextPath.includes("//") ||
    nextPath.includes("\\") ||
    nextPath.includes("%") ||
    nextPath.includes("#") ||
    /[\u0000-\u0020\u007f]/.test(nextPath)
  ) {
    return homePath;
  }

  const pathname = nextPath.split("?", 1)[0];
  const segments = pathname.split("/");

  if (segments.some((segment) => segment === "." || segment === "..")) {
    return homePath;
  }

  if (pathname !== homePath && !pathname.startsWith(`${homePath}/`)) {
    return homePath;
  }

  return nextPath;
}

export function profileUnavailableLoginPath(): string {
  return `/login?error=${PROFILE_UNAVAILABLE_ERROR}`;
}

export function decideProfileAccess(
  role: unknown,
  lookupFailed = false,
):
  | {
      kind: "authenticated";
      role: ProfileRole;
      destination: string;
      signOut: false;
    }
  | { kind: "indeterminate"; destination: null; signOut: false }
  | { kind: "recover"; destination: string; signOut: true } {
  if (lookupFailed) {
    return { kind: "indeterminate", destination: null, signOut: false };
  }

  if (isProfileRole(role)) {
    return {
      kind: "authenticated",
      role,
      destination: homePathForRole(role),
      signOut: false,
    };
  }

  return {
    kind: "recover",
    destination: profileUnavailableLoginPath(),
    signOut: true,
  };
}

export function loginMessageForError(
  error: string | string[] | undefined,
): string | null {
  return error === PROFILE_UNAVAILABLE_ERROR
    ? authMessageFor("profile_unavailable")
    : null;
}
