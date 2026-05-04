"use client";

import { useState } from "react";

type PasswordFieldProps = {
  defaultValue?: string;
  label: string;
  name?: string;
  readOnlyValue?: string;
};

export function PasswordField({
  defaultValue = "",
  label,
  name,
  readOnlyValue,
}: PasswordFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const value = readOnlyValue ?? defaultValue;

  if (!name) {
    return (
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="label">{label}</p>
          <button
            className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)] transition hover:text-[var(--color-soft)]"
            onClick={() => setRevealed((current) => !current)}
            type="button"
          >
            {revealed ? "Hide" : "Reveal"}
          </button>
        </div>
        <div className="field mt-2">
          {revealed ? value || "Not added yet" : value ? "••••••••••" : "Not added yet"}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="label">{label}</p>
        <button
          className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)] transition hover:text-[var(--color-soft)]"
          onClick={() => setRevealed((current) => !current)}
          type="button"
        >
          {revealed ? "Hide" : "Reveal"}
        </button>
      </div>
      <input
        className="field mt-2"
        defaultValue={defaultValue}
        name={name}
        type={revealed ? "text" : "password"}
      />
    </div>
  );
}
