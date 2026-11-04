export function IconShower({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 4v4a4 4 0 0 0 4 4h8" />
      <path d="M8 20v-2" />
      <path d="M12 20v-3" />
      <path d="M16 20v-2" />
      <circle cx="20" cy="4" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSunrise({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="M20 4.93l-1.41 1.41" />
      <path d="M12 8a4 4 0 1 0 0 8" />
      <path d="M4 18h16" />
      <path d="M8 22h8" />
    </svg>
  );
}

export function IconDroplets({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.5c2 3.5 5.5 6.2 5.5 10a5.5 5.5 0 1 1-11 0c0-3.8 3.5-6.5 5.5-10Z" />
    </svg>
  );
}
