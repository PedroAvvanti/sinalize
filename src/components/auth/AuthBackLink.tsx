import Link from "next/link";

type AuthBackLinkProps = {
  href?: string;
};

export function AuthBackLink({ href = "/" }: AuthBackLinkProps) {
  return (
    <Link className="auth-back" href={href} aria-label="Voltar ao início">
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
