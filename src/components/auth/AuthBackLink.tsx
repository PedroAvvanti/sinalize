import Link from "next/link";

type AuthBackLinkProps = {
  href?: string;
  label?: string;
};

export function AuthBackLink({
  href = "/",
  label = "Voltar ao início",
}: AuthBackLinkProps) {
  return (
    <Link className="auth-back" href={href} aria-label={label}>
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
