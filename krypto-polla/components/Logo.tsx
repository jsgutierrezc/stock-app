export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-2 select-none"
      aria-label="Krypto-Polla Natillera"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="grass" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#166534" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#grass)" />
        <path
          d="M32 12 L40 18 L37 28 L27 28 L24 18 Z"
          fill="#0f172a"
          opacity="0.85"
        />
        <path
          d="M32 12 L24 18 M32 12 L40 18 M27 28 L20 36 M37 28 L44 36 M27 28 L32 38 L37 28"
          stroke="#f8fafc"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="32" cy="48" r="3" fill="#facc15" />
      </svg>
      <span className="flex flex-col leading-tight">
        <span className="text-[0.68rem] uppercase tracking-[0.18em] text-pitch-700 dark:text-pitch-100/80">
          Natillera
        </span>
        <span className="text-base font-extrabold tracking-tight">
          Krypto-Polla <span className="text-pitch-600">2026</span>
        </span>
      </span>
    </span>
  );
}
