import { requestPasswordResetAction, signInWithPasswordAction } from "@/app/actions";
import { FlashBanner } from "@/components/flash-banner";
import { SubmitButton } from "@/components/submit-button";
import { getAllowedEmail } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    message?: string;
    type?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const allowedEmail = getAllowedEmail();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,_rgba(81,135,169,0.28),_transparent_36%),linear-gradient(160deg,_rgba(24,54,72,0.94),_rgba(13,21,29,0.98))] p-8 shadow-[0_24px_60px_rgba(1,8,13,0.34)]">
            <p className="section-eyebrow">Private CRM</p>
            <h1 className="mt-4 font-display text-6xl leading-none text-[var(--color-soft)]">
              Sign in to your KAGE Media workspace.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-8 text-slate-300/80">
              This CRM is locked to a single authorized email and password.
              Sign in with your Supabase account credentials to open the app.
            </p>
          </section>

          <section className="panel">
            <div>
              <p className="section-eyebrow">Access</p>
              <h2 className="section-title">Email login</h2>
            </div>

            <form action={signInWithPasswordAction} className="mt-6 space-y-4">
              <div>
                <p className="label">Allowed email</p>
                <input
                  className="field mt-2"
                  name="email"
                  type="email"
                  defaultValue={allowedEmail}
                  required
                />
              </div>

              <div>
                <p className="label">Password</p>
                <input
                  className="field mt-2"
                  name="password"
                  minLength={8}
                  type="password"
                  required
                />
                <p className="field-hint">Use the password tied to your Supabase user.</p>
              </div>

              <FlashBanner message={params?.message} type={params?.type} />

              <SubmitButton className="btn-primary" pendingText="Signing in...">
                Sign in
              </SubmitButton>
            </form>

            <div className="mt-8 border-t border-white/8 pt-6">
              <p className="label">Forgot password</p>
              <form action={requestPasswordResetAction} className="mt-3 space-y-4">
                <input
                  className="field"
                  name="email"
                  type="email"
                  defaultValue={allowedEmail}
                  required
                />
                <SubmitButton className="btn-secondary" pendingText="Sending reset...">
                  Send reset email
                </SubmitButton>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
