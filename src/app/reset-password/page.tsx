import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,_rgba(81,135,169,0.28),_transparent_36%),linear-gradient(160deg,_rgba(24,54,72,0.94),_rgba(13,21,29,0.98))] p-8 shadow-[0_24px_60px_rgba(1,8,13,0.34)]">
            <p className="section-eyebrow">Private CRM</p>
            <h1 className="mt-4 font-display text-6xl leading-none text-[var(--color-soft)]">
              Reset your KAGE Media password.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-8 text-slate-300/80">
              Use the recovery link from your email to set a new password, then
              go back to the normal login screen.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex text-xs uppercase tracking-[0.18em] text-[var(--color-accent)] transition hover:text-[var(--color-soft)]"
            >
              Back to login
            </Link>
          </section>

          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
