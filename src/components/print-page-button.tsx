"use client";

export function PrintPageButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className}
    >
      Print invoice
    </button>
  );
}
