type FeedbackBannerProps = {
  message?: string;
  type?: string;
};

export function FeedbackBanner({ message, type }: FeedbackBannerProps) {
  if (!message) {
    return null;
  }

  const decodedMessage = decodeURIComponent(message);
  const isError = type === "error";

  return (
    <div
      className={`rounded-[1.25rem] border px-4 py-3 text-sm ${
        isError
          ? "border-[rgba(210,98,58,0.38)] bg-[rgba(210,98,58,0.14)] text-[rgba(255,228,214,0.96)]"
          : "border-[rgba(81,169,130,0.28)] bg-[rgba(81,169,130,0.14)] text-[rgba(222,245,229,0.92)]"
      }`}
    >
      {decodedMessage}
    </div>
  );
}
