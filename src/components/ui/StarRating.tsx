type StarRatingProps = {
  value: number;
  max?: number;
  label?: string;
  size?: "sm" | "md";
};

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={filled ? "star-rating__icon star-rating__icon--filled" : "star-rating__icon"}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path
        d="M12 2.5 14.9 9l7.4.6-5.6 4.8 1.7 7.2L12 17.8 5.6 21.6l1.7-7.2L1.7 9.6 9.1 9 12 2.5Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarRating({
  value,
  max = 5,
  label,
  size = "md",
}: StarRatingProps) {
  const rounded = Math.round(value * 2) / 2;
  const fullStars = Math.floor(rounded);
  const hasHalf = rounded - fullStars >= 0.5;

  return (
    <span
      className={`star-rating star-rating--${size}`}
      role="img"
      aria-label={label ?? `Nota ${value.toFixed(1)} de ${max}`}
    >
      {Array.from({ length: max }, (_, index) => {
        const filled = index < fullStars || (index === fullStars && hasHalf);
        return <StarIcon key={index} filled={filled} />;
      })}
      <span className="star-rating__value">{value.toFixed(1)}</span>
    </span>
  );
}
