"use client";

import { useFormStatus } from "react-dom";

type ConfirmSubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  confirmMessage: string;
  formAction?: (formData: FormData) => void;
  formNoValidate?: boolean;
  pendingText?: string;
};

export function ConfirmSubmitButton({
  children,
  className,
  confirmMessage,
  formAction,
  formNoValidate,
  pendingText,
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      className={className}
      disabled={pending}
      formAction={formAction}
      formNoValidate={formNoValidate}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }

        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {pending ? pendingText ?? "Working..." : children}
    </button>
  );
}
