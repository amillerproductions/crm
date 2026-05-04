"use client";

export function CopyShareLinkButton({
  className,
  url,
}: {
  className?: string;
  url: string;
}) {
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
      }}
      className={className}
    >
      Copy share link
    </button>
  );
}
