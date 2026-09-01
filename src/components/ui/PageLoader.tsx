export function PageLoader({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="page-loader__spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
