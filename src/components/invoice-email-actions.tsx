"use client";

type InvoiceEmailActionsProps = {
  body: string;
  recipient: string;
  subject: string;
};

export function InvoiceEmailActions({
  body,
  recipient,
  subject,
}: InvoiceEmailActionsProps) {
  const openDraft = () => {
    const url = new URL("mailto:");

    if (recipient) {
      url.pathname = recipient;
    }

    url.searchParams.set("subject", subject);
    url.searchParams.set("body", body);
    window.location.href = url.toString();
  };

  const copyEmail = async () => {
    const content = [`To: ${recipient || "client email"}`, `Subject: ${subject}`, "", body].join(
      "\n",
    );

    await navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={openDraft}
        className="btn-secondary"
      >
        Open email draft
      </button>
      <button
        type="button"
        onClick={copyEmail}
        className="btn-secondary"
      >
        Copy email copy
      </button>
    </div>
  );
}
