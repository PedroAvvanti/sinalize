export const MIN_PASSWORD_LENGTH = 8;

export function validatePasswordLength(
  password: string,
): { ok: true } | { ok: false; error: string } {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }

  return { ok: true };
}
