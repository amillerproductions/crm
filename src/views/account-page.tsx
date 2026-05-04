import Image from "next/image";
import {
  changePasswordAction,
  createAccountCredentialAction,
  deleteAccountCredentialAction,
  updateAccountAction,
  updateAccountCredentialAction,
} from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FlashBanner } from "@/components/flash-banner";
import { PasswordField } from "@/components/password-field";
import { SubmitButton } from "@/components/submit-button";
import { getFeedbackFromSearchParams } from "@/lib/feedback";
import { normalizeExternalUrl } from "@/lib/url";

type AccountPageViewProps = {
  credentials: Array<{
    id: string;
    label: string;
    username: string;
    password: string;
    url: string;
    notes: string;
  }>;
  userEmail: string;
  userId: string;
  displayName: string;
  createdAt?: string;
  searchParams?: Promise<{
    message?: string;
    type?: string;
  }>;
};

export default async function AccountPageView({
  credentials,
  userEmail,
  userId,
  displayName,
  createdAt,
  searchParams,
}: AccountPageViewProps) {
  const feedback = getFeedbackFromSearchParams(await searchParams);
  const joinedLabel = displayName || userEmail;
  const initials = joinedLabel
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || userEmail.charAt(0).toUpperCase();
  const memberSince = createdAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(new Date(createdAt))
    : "Recently";

  return (
    <div className="space-y-8">
      <FlashBanner message={feedback.message} type={feedback.type} />

      <section className="relative overflow-hidden rounded-[2.2rem] border border-white/8 bg-[linear-gradient(145deg,_rgba(27,60,80,0.95),_rgba(12,19,27,0.98))] p-6 shadow-[0_24px_60px_rgba(1,8,13,0.34)] lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(81,135,169,0.28),_transparent_28%),radial-gradient(circle_at_85%_15%,_rgba(233,228,216,0.1),_transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(51,86,113,0.24),_transparent_30%)]" />
        <div className="absolute -right-18 top-8 hidden h-56 w-56 rounded-full border border-white/6 bg-white/[0.03] blur-3xl lg:block" />
        <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[var(--color-accent)]/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
              <div className="relative h-7 w-7 overflow-hidden rounded-full border border-white/10 bg-white/5">
                <Image
                  src="/kage-mark.png"
                  alt="KAGE Media"
                  fill
                  sizes="28px"
                  className="object-contain p-1.5"
                />
              </div>
              <p className="section-eyebrow !mb-0">Account studio</p>
            </div>

            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-none text-[var(--color-soft)] sm:text-6xl">
              Shape how your private workspace feels.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300/78 sm:text-[0.96rem]">
              Keep your profile polished, make the sidebar feel more personal than
              an email address, and manage the password protecting this CRM from
              one focused surface.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Display",
                  value: displayName || "Set your name",
                },
                {
                  label: "Access",
                  value: "Private CRM",
                },
                {
                  label: "Member since",
                  value: memberSince,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.3rem] border border-white/8 bg-white/[0.05] px-4 py-4 backdrop-blur-sm"
                >
                  <p className="label">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-soft)] sm:text-base">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative w-full max-w-[26rem] rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.03))] p-5 backdrop-blur-md">
            <div className="absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,_transparent,_rgba(233,228,216,0.45),_transparent)]" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="label">Signed in as</p>
                <p className="mt-3 text-xl font-semibold text-[var(--color-soft)]">
                  {displayName || "No display name set yet"}
                </p>
                <p className="mt-2 text-sm text-slate-300/74">{userEmail}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-[var(--color-accent)]/26 bg-[linear-gradient(160deg,_rgba(81,135,169,0.2),_rgba(81,135,169,0.06))] text-xl font-semibold uppercase tracking-[0.18em] text-[var(--color-soft)] shadow-[0_12px_30px_rgba(81,135,169,0.16)]">
                {initials}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                "Your display name appears in the account badge inside the sidebar.",
                "Password updates stay in-app, so you do not need a separate reset flow for routine changes.",
                "This page keeps identity and security together instead of scattering account actions across the rail.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[1.15rem] border border-white/8 bg-black/10 px-4 py-3"
                >
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                  <p className="text-sm leading-6 text-slate-200/82">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form
          action={updateAccountAction}
          className="panel relative overflow-hidden rounded-[1.9rem] border border-white/8 bg-[linear-gradient(180deg,_rgba(24,54,72,0.94),_rgba(16,31,40,0.98))]"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,_rgba(81,135,169,0.15),_rgba(81,135,169,0.8),_rgba(81,135,169,0.15))]" />
          <div>
            <p className="section-eyebrow">Profile</p>
            <h2 className="section-title">How your account appears</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300/76">
              This name is saved to your Supabase user profile and used anywhere we
              want the CRM to feel more personal than just an email address.
            </p>
          </div>

          <input name="redirectTo" type="hidden" value="/account" />

          <div className="mt-6 grid gap-5">
            <div className="rounded-[1.35rem] border border-white/8 bg-black/10 p-4">
              <p className="label">Display name</p>
              <input
                className="field mt-2"
                name="displayName"
                defaultValue={displayName}
                placeholder="Andrew Miller"
                minLength={2}
                maxLength={60}
                required
              />
              <p className="field-hint">
                Use the name you want shown in the app.
              </p>
            </div>

            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.04] p-4">
              <p className="label">Email</p>
              <input className="field mt-2 opacity-80" value={userEmail} disabled />
              <p className="field-hint">
                Email access is currently controlled through your allowed Supabase
                login.
              </p>
            </div>

            <div className="rounded-[1.35rem] border border-white/8 bg-[var(--color-panel-strong)]/45 p-4">
              <p className="label">Design note</p>
              <p className="mt-2 text-sm leading-7 text-slate-200/82">
                A good display name makes the account area and sidebar feel less
                like raw infrastructure and more like a branded private studio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <SubmitButton className="btn-primary" pendingText="Saving profile...">
                Save profile
              </SubmitButton>
            </div>
          </div>
        </form>

        <form
          action={changePasswordAction}
          className="panel relative overflow-hidden rounded-[1.9rem] border border-white/8 bg-[linear-gradient(180deg,_rgba(18,30,39,0.98),_rgba(13,21,29,0.99))]"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,_rgba(233,228,216,0.06),_rgba(233,228,216,0.35),_rgba(233,228,216,0.06))]" />
          <div>
            <p className="section-eyebrow">Security</p>
            <h2 className="section-title">Change your password</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300/76">
              Update the password tied to this account without leaving the CRM.
            </p>
          </div>

          <input name="redirectTo" type="hidden" value="/account" />

          <div className="mt-6 grid gap-5">
            <div className="rounded-[1.35rem] border border-white/8 bg-black/10 p-4">
              <p className="label">New password</p>
              <input
                className="field mt-2"
                minLength={8}
                name="password"
                type="password"
                required
              />
              <p className="field-hint">Use at least 8 characters.</p>
            </div>

            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.04] p-4">
              <p className="label">Confirm password</p>
              <input
                className="field mt-2"
                minLength={8}
                name="confirmPassword"
                type="password"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "Use a unique password for this CRM login.",
                "Longer passphrases are easier to remember and harder to crack.",
                "Routine password changes now live here instead of the sidebar.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.15rem] border border-white/8 bg-[var(--color-panel-strong)]/42 px-4 py-4"
                >
                  <p className="text-sm leading-6 text-slate-200/80">{item}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <SubmitButton className="btn-secondary" pendingText="Updating password...">
                Update password
              </SubmitButton>
            </div>
          </div>
        </form>
      </section>

      <section className="panel relative overflow-hidden rounded-[1.9rem] border border-white/8 bg-[linear-gradient(180deg,_rgba(17,31,41,0.99),_rgba(10,18,25,0.99))]">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,_rgba(81,135,169,0.12),_rgba(81,135,169,0.65),_rgba(81,135,169,0.12))]" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">Stored passwords</p>
            <h2 className="section-title">Your private login vault</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/76">
              Save personal service logins that are useful across your business but
              do not belong to one specific client project.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-100/80">
            {credentials.length} stored
          </span>
        </div>

        <div className="mt-6 space-y-4">
          <form
            action={createAccountCredentialAction}
            className="rounded-[1.4rem] border border-white/8 bg-[var(--color-panel-strong)]/58 p-5"
          >
            <input type="hidden" name="userId" value={userId} />
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="label">Credential label</p>
                <input className="field mt-2" name="label" placeholder="Stripe, GoDaddy, business card..." minLength={2} required />
              </div>
              <div>
                <p className="label">URL</p>
                <input className="field mt-2" name="url" placeholder="example.com or service login" />
                <p className="field-hint">Optional, but helpful when this belongs to a specific service.</p>
              </div>
              <div>
                <p className="label">Username</p>
                <input className="field mt-2" name="username" />
              </div>
              <PasswordField label="Password" name="password" />
            </div>
            <div className="mt-4">
              <p className="label">Notes</p>
              <textarea className="field-area mt-2" name="notes" placeholder="2FA note, billing note, recovery detail..." />
            </div>
            <SubmitButton className="btn-primary mt-4" pendingText="Saving password...">
              Save stored password
            </SubmitButton>
          </form>

          {credentials.length === 0 ? (
            <div className="rounded-[1.4rem] border border-dashed border-white/10 px-5 py-6 text-sm text-slate-300/70">
              No personal passwords stored yet.
            </div>
          ) : (
            credentials.map((credential) => {
              const normalizedUrl = normalizeExternalUrl(credential.url);

              return (
                <article
                  key={credential.id}
                  className="rounded-[1.4rem] border border-white/8 bg-[var(--color-panel-strong)]/58 p-5"
                >
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="label">Credential label</p>
                      <div className="field mt-2">{credential.label}</div>
                    </div>
                    <div>
                      <p className="label">URL</p>
                      {normalizedUrl ? (
                        <a
                          className="field mt-2 block break-all underline decoration-white/15 underline-offset-4 transition hover:text-[var(--color-accent)]"
                          href={normalizedUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {credential.url}
                        </a>
                      ) : (
                        <div className="field mt-2 break-all">{credential.url || "Not added yet"}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="label">Username</p>
                      <div className="field mt-2">{credential.username || "Not added yet"}</div>
                    </div>
                    <PasswordField label="Password" readOnlyValue={credential.password} />
                  </div>
                  <div className="mt-4">
                    <p className="label">Notes</p>
                    <div className="field-area mt-2">{credential.notes || "No notes yet."}</div>
                  </div>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
                      Edit stored password
                    </summary>
                    <form
                      action={updateAccountCredentialAction}
                      className="mt-4 space-y-4 rounded-[1.25rem] border border-white/8 bg-black/10 p-4"
                    >
                      <input type="hidden" name="id" value={credential.id} />
                      <input type="hidden" name="userId" value={userId} />
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                          <p className="label">Credential label</p>
                          <input className="field mt-2" name="label" defaultValue={credential.label} minLength={2} required />
                        </div>
                        <div>
                          <p className="label">URL</p>
                          <input className="field mt-2" name="url" defaultValue={credential.url} />
                        </div>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                          <p className="label">Username</p>
                          <input className="field mt-2" name="username" defaultValue={credential.username} />
                        </div>
                        <PasswordField label="Password" name="password" defaultValue={credential.password} />
                      </div>
                      <div>
                        <p className="label">Notes</p>
                        <textarea className="field-area mt-2" name="notes" defaultValue={credential.notes} />
                      </div>
                      <SubmitButton className="btn-secondary" pendingText="Saving password...">
                        Save stored password
                      </SubmitButton>
                      <ConfirmSubmitButton
                        className="mt-3 text-xs uppercase tracking-[0.18em] text-[rgba(255,228,214,0.9)] transition hover:text-[rgba(255,200,180,0.98)]"
                        confirmMessage="Delete this stored password?"
                        formAction={deleteAccountCredentialAction}
                        pendingText="Deleting..."
                      >
                        Delete stored password
                      </ConfirmSubmitButton>
                    </form>
                  </details>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
