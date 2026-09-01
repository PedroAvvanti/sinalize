"use client";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  return (
    <section className="app-panel app-error" aria-labelledby="app-error-title">
      <p className="auth-eyebrow">Algo deu errado</p>
      <h1 id="app-error-title">Não foi possível carregar esta página</h1>
      <p className="app-error__lead" role="alert">
        {error.message || "Tente novamente em alguns instantes."}
      </p>
      <button className="auth-submit" type="button" onClick={reset}>
        Tentar novamente
      </button>
    </section>
  );
}
