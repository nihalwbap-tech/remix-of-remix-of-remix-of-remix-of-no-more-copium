export function BooksShelfIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className || "h-5 w-5"}
      aria-hidden="true"
    >
      {/* Book 1 (Left vertical) */}
      <path d="M4 19V5a1 1 0 0 1 1-1h2.5a1 1 0 0 1 1 1v14" />
      {/* Book 2 (Middle vertical) */}
      <path d="M8.5 19V5a1 1 0 0 1 1-1H12a1 1 0 0 1 1 1v14" />
      {/* Book 3 (Right tilted book) */}
      <path d="M13.5 19l2.8-14.2a1 1 0 0 1 1.2-.8l2.2.4a1 1 0 0 1 .8 1.2L18 19" />
      {/* Shelf Line (Horizontal baseline) */}
      <path d="M2 19h20" />
    </svg>
  );
}
