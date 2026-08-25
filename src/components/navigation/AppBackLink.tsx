import Link from "next/link";

type AppBackLinkProps = {
  href: string;
  label?: string;
};

export function AppBackLink({
  href,
  label = "Voltar",
}: AppBackLinkProps) {
  return (
    <Link className="app-back" href={href} aria-label={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M15 6l-6 6 6 6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.25"
        />
      </svg>
    </Link>
  );
}
