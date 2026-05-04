import Link from "next/link";
import { createClientAction } from "@/app/actions";
import { FlashBanner } from "@/components/flash-banner";
import { SubmitButton } from "@/components/submit-button";
import { getFeedbackFromSearchParams } from "@/lib/feedback";

type NewClientPageProps = {
  searchParams?: Promise<{
    message?: string;
    type?: string;
  }>;
};

export default async function NewClientPageView({
  searchParams,
}: NewClientPageProps) {
  const feedback = getFeedbackFromSearchParams(await searchParams);

  return (
    <div className="space-y-8">
      <FlashBanner message={feedback.message} type={feedback.type} />

      <header className="space-y-5">
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--color-accent)] transition hover:text-[var(--color-soft)]"
        >
          <span>Back to clients</span>
        </Link>

        <div className="rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,_rgba(81,135,169,0.22),_transparent_36%),linear-gradient(160deg,_rgba(24,54,72,0.94),_rgba(13,21,29,0.98))] p-6 shadow-[0_24px_60px_rgba(1,8,13,0.34)]">
          <p className="section-eyebrow">New client</p>
          <h1 className="mt-3 font-display text-5xl leading-none text-[var(--color-soft)]">
            Add a new client record.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300/78">
            Start the relationship cleanly here, then connect projects as the
            work moves from outreach to launch.
          </p>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="panel">
          <div>
            <p className="section-eyebrow">Client details</p>
            <h2 className="section-title">Create the record</h2>
          </div>

          <form action={createClientAction} className="mt-6 space-y-4">
            <input name="redirectTo" type="hidden" value="/clients" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="label">Client name</p>
                <input className="field mt-2" name="name" minLength={2} required />
                <p className="field-hint">Use the main point of contact you work with.</p>
              </div>
              <div>
                <p className="label">Company</p>
                <input className="field mt-2" name="company" minLength={2} required />
                <p className="field-hint">This name carries through to projects and dashboards.</p>
              </div>
              <div>
                <p className="label">Email</p>
                <input className="field mt-2" name="email" type="email" />
              </div>
              <div>
                <p className="label">Phone</p>
                <input className="field mt-2" name="phone" type="tel" />
                <p className="field-hint">Optional, but useful for faster follow-up.</p>
              </div>
            </div>
            <div>
              <p className="label">Notes</p>
              <textarea className="field-area mt-2" name="notes" />
              <p className="field-hint">Capture anything helpful about communication style, scope, or next steps.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SubmitButton className="btn-primary" pendingText="Creating client...">
                Create client
              </SubmitButton>
              <Link className="btn-secondary" href="/clients">
                Cancel
              </Link>
            </div>
          </form>
        </section>

        <section className="panel">
          <div>
            <p className="section-eyebrow">Why this page</p>
            <h2 className="section-title">A calmer intake flow</h2>
          </div>

          <div className="mt-6 grid gap-4">
            {[
              "You get a full-screen form instead of a cramped dropdown in the corner.",
              "It matches the dedicated client and project workspaces already in the app.",
              "It gives you room to add more intake fields later without crowding the clients list.",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-[1.25rem] border border-white/8 bg-[var(--color-panel-strong)]/55 px-4 py-4"
              >
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                <p className="text-sm leading-6 text-slate-200/86">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
