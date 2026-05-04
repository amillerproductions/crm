"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/tasks", label: "Tasks", icon: TasksIcon },
  { href: "/prospects", label: "Prospects", icon: ProspectsIcon },
  { href: "/clients", label: "Clients", icon: ClientsIcon },
  { href: "/projects", label: "Projects", icon: ProjectsIcon },
  { href: "/finance", label: "Finance", icon: FinanceIcon },
];

export function AppShell({
  children,
  userEmail,
  userDisplayName,
  signOutAction,
}: {
  children: React.ReactNode;
  userEmail: string;
  userDisplayName?: string;
  signOutAction: (formData: FormData) => void;
}) {
  const pathname = usePathname();
  const accountLabel = userDisplayName || userEmail;
  const userInitial = accountLabel.charAt(0).toUpperCase();
  const isAccountActive = pathname.startsWith("/account");

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(81,135,169,0.2),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(51,86,113,0.22),_transparent_25%)]" />
      <div className="mx-auto flex min-h-screen w-[min(95vw,2200px)] flex-col gap-5 px-3 py-3 lg:flex-row lg:px-4 lg:py-4">
        <aside className="w-full rounded-[1.8rem] border border-white/8 bg-[var(--color-panel)]/92 p-3 shadow-[0_25px_60px_rgba(1,8,13,0.32)] lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-[104px] lg:flex-none lg:p-3">
          <div className="flex items-center justify-between gap-3 lg:h-full lg:flex-col lg:justify-start">
            <Link
              href="/"
              aria-label="Go to dashboard"
              className="group relative flex h-14 w-14 flex-none items-center justify-center rounded-[1.35rem] border border-white/10 bg-[linear-gradient(160deg,_rgba(81,135,169,0.18),_rgba(13,21,29,0.18))] shadow-[0_16px_30px_rgba(1,8,13,0.2)] transition hover:border-[var(--color-accent)]/45 hover:bg-[var(--color-panel-strong)]/95"
            >
              <Image
                src="/kage-mark.png"
                alt="KAGE Media"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                preload={true}
              />
              <Tooltip>Dashboard home</Tooltip>
            </Link>

            <nav className="flex items-center gap-2 lg:mt-8 lg:flex-col">
              {navigation.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    className={`group relative flex h-12 w-12 items-center justify-center rounded-[1.1rem] border transition ${
                      isActive
                        ? "border-[var(--color-accent)]/55 bg-[var(--color-accent)] text-[var(--color-soft)] shadow-[0_16px_32px_rgba(81,135,169,0.24)]"
                        : "border-white/8 bg-white/[0.03] text-slate-300/82 hover:border-white/14 hover:bg-white/[0.06] hover:text-[var(--color-soft)]"
                    }`}
                    title={item.label}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                    <Tooltip>{item.label}</Tooltip>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 lg:mt-auto lg:flex-col">
              <Link
                href="/account"
                aria-label="Account settings"
                title={accountLabel}
                className={`group relative flex h-11 w-11 items-center justify-center rounded-[1rem] border text-sm font-semibold uppercase tracking-[0.18em] transition ${
                  isAccountActive
                    ? "border-[var(--color-accent)]/55 bg-[var(--color-accent)] text-[var(--color-soft)] shadow-[0_16px_32px_rgba(81,135,169,0.24)]"
                    : "border-white/10 bg-black/10 text-[var(--color-soft)]/88 hover:border-white/16 hover:bg-white/[0.06]"
                }`}
              >
                {userInitial}
                <Tooltip>{accountLabel}</Tooltip>
              </Link>

              <form action={signOutAction}>
                <button
                  className="group relative flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/10 bg-white/[0.03] text-slate-300/82 transition hover:border-white/16 hover:bg-white/[0.06] hover:text-[var(--color-soft)]"
                  type="submit"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <SignOutIcon className="h-5 w-5" />
                  <Tooltip>Sign out</Tooltip>
                </button>
              </form>
            </div>
          </div>
        </aside>

        <main className="flex-1 rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,_rgba(18,30,39,0.98),_rgba(13,21,29,0.96))] p-5 shadow-[0_25px_65px_rgba(1,8,13,0.32)] sm:p-6 lg:p-8 xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-1/2 top-[calc(100%+0.7rem)] z-20 hidden -translate-x-1/2 rounded-full border border-white/10 bg-[var(--color-panel-strong)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] whitespace-nowrap text-[var(--color-soft)] shadow-[0_14px_34px_rgba(1,8,13,0.32)] group-hover:block lg:left-[calc(100%+0.75rem)] lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0">
      {children}
    </span>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4.75" y="4.75" width="6.25" height="6.25" rx="1.4" />
      <rect x="13" y="4.75" width="6.25" height="9.5" rx="1.4" />
      <rect x="4.75" y="13" width="6.25" height="6.25" rx="1.4" />
      <rect x="13" y="16.5" width="6.25" height="2.75" rx="1.4" />
    </svg>
  );
}

function ClientsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16.75 18.25a4.75 4.75 0 0 0-9.5 0" />
      <circle cx="12" cy="8.25" r="3.25" />
      <path d="M18.5 18.25a3.25 3.25 0 0 0-2.75-3.2M17 6.25a2.75 2.75 0 1 1 0 5.5" />
    </svg>
  );
}

function ProspectsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5.5 18.25c.4-2.72 2.8-4.75 5.75-4.75S16.6 15.53 17 18.25" />
      <circle cx="11.25" cy="8.5" r="3.25" />
      <path d="M18 9.25h2.5M19.25 8v2.5" />
    </svg>
  );
}

function TasksIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9.5 7.25h9M9.5 12h9M9.5 16.75h9" />
      <path d="m4.75 7.25 1.25 1.25 2-2.25M4.75 12l1.25 1.25 2-2.25M4.75 16.75 6 18l2-2.25" />
    </svg>
  );
}

function ProjectsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4.75" y="5" width="3.5" height="14" rx="1.2" />
      <rect x="10.25" y="5" width="3.5" height="8.5" rx="1.2" />
      <rect x="15.75" y="5" width="3.5" height="11.5" rx="1.2" />
    </svg>
  );
}

function FinanceIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 4.5v15M15.75 7.5c0-1.66-1.68-3-3.75-3s-3.75 1.34-3.75 3 1.68 3 3.75 3 3.75 1.34 3.75 3-1.68 3-3.75 3-3.75-1.34-3.75-3" />
    </svg>
  );
}

function SignOutIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9.25 5.75H6.5a1.75 1.75 0 0 0-1.75 1.75v9a1.75 1.75 0 0 0 1.75 1.75h2.75" />
      <path d="M13 8.25 17 12l-4 3.75M17 12H9.25" />
    </svg>
  );
}
