type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

/**
 * Rate limiter em memória (por instância do servidor).
 * Adequado para MVP; em produção multi-instância, usar Redis/Upstash.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { ok: true };
}

export function rateLimitErrorMessage(retryAfterSeconds: number): string {
  if (retryAfterSeconds <= 60) {
    return `Muitas tentativas. Aguarde ${retryAfterSeconds} segundos e tente novamente.`;
  }

  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Muitas tentativas. Aguarde ${minutes} minuto(s) e tente novamente.`;
}
