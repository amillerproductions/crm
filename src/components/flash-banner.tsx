type FlashBannerProps = {
  message?: string;
  type?: string;
};

export function FlashBanner({ message, type = "success" }: FlashBannerProps) {
  if (!message) {
    return null;
  }

  const tone =
    type === "error"
      ? "border-[rgba(210,98,58,0.38)] bg-[rgba(210,98,58,0.14)] text-[rgba(255,228,214,0.96)]"
      : "border-[rgba(81,169,130,0.28)] bg-[rgba(81,169,130,0.14)] text-[rgba(222,245,229,0.92)]";

  return (
    <div className={`rounded-[1.2rem] border px-4 py-3 text-sm ${tone}`}>
      {message}
    </div>
  );
}
