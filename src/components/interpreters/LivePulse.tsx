export function LivePulse() {
  return (
    <svg
      className="live-pulse"
      aria-hidden="true"
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="live-pulse__core" cx="140" cy="100" r="7" />
      <path
        className="live-pulse__arc live-pulse__arc--1"
        d="M78 100 C78 66, 106 38, 140 38 C174 38, 202 66, 202 100"
      />
      <path
        className="live-pulse__arc live-pulse__arc--2"
        d="M52 100 C52 51, 91 12, 140 12 C189 12, 228 51, 228 100"
      />
      <path
        className="live-pulse__arc live-pulse__arc--3"
        d="M28 100 C28 38, 78 -14, 140 -14 C202 -14, 252 38, 252 100"
      />
      <path
        className="live-pulse__wave"
        d="M24 148 C52 118, 78 176, 112 142 C138 116, 156 168, 188 138 C214 114, 238 156, 256 132"
      />
    </svg>
  );
}
