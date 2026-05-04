"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  formAction?: (formData: FormData) => void;
  formNoValidate?: boolean;
  pendingText?: string;
};

export function SubmitButton({
  children,
  className,
  formAction,
  formNoValidate,
  pendingText,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      className={className}
      disabled={pending}
      formAction={formAction}
      formNoValidate={formNoValidate}
      type="submit"
    >
      {pending ? pendingText ?? "Saving..." : children}
    </button>
  );
}
