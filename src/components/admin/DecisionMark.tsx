export function DecisionMark() {
  return (
    <svg
      className="decision-mark"
      aria-hidden="true"
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="decision-mark__ring" cx="168" cy="88" r="54" />
      <circle
        className="decision-mark__ring decision-mark__ring--inner"
        cx="168"
        cy="88"
        r="34"
      />
      <path
        className="decision-mark__ticks"
        d="M168 28 V42 M168 134 V148 M112 88 H126 M210 88 H224"
      />
      <path
        className="decision-mark__stroke"
        d="M112 108 C142 138, 176 68, 226 52"
      />
    </svg>
  );
}
