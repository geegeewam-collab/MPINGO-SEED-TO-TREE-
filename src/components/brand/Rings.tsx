// Tree rings: the one decorative motif used across the product.
export function Rings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1" className={className} aria-hidden="true">
      {[12, 24, 37, 51, 66, 82, 99].map((r, i) => <circle key={r} cx="100" cy="100" r={r + (i % 2)} />)}
    </svg>
  );
}
