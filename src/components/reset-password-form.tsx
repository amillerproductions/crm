"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/browser-auth";

export function ResetPasswordForm() {
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        setError("This reset link is invalid or expired.");
      } else {
        setReady(true);
      }
    });
  }, []);

  async function handleSubmit(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    setMessage(null);
    setError(null);

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError("Could not update password.");
        return;
      }

      setMessage("Password updated. You can sign in now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel">
      <div>
        <p className="section-eyebrow">Recovery</p>
        <h2 className="section-title">Set a new password</h2>
      </div>

      {!ready && !error ? (
        <p className="mt-6 text-sm text-slate-300/80">Checking reset session...</p>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(210,98,58,0.38)] bg-[rgba(210,98,58,0.14)] px-4 py-3 text-sm text-[rgba(255,228,214,0.96)]">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(81,169,130,0.28)] bg-[rgba(81,169,130,0.14)] px-4 py-3 text-sm text-[rgba(222,245,229,0.92)]">
          {message}
        </div>
      ) : null}

      {ready ? (
        <form
          action={handleSubmit}
          className="mt-6 space-y-4"
        >
          <div>
            <p className="label">New password</p>
            <input className="field mt-2" minLength={8} name="password" type="password" required />
            <p className="field-hint">Use at least 8 characters.</p>
          </div>
          <div>
            <p className="label">Confirm password</p>
            <input className="field mt-2" minLength={8} name="confirmPassword" type="password" required />
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Update password"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
