"use client";

export function SavePdfButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className}
    >
      Save PDF
    </button>
  );
}
