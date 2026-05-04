import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteClientAction, updateClientAction } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FlashBanner } from "@/components/flash-banner";
import { SubmitButton } from "@/components/submit-button";
import { getClientById, getProjectsForClient } from "@/lib/crm-data";
import { getFeedbackFromSearchParams } from "@/lib/feedback";

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    message?: string;
    type?: string;
  }>;
};

function parseCurrency(value: string) {
  return Number(value.replace(/[$,]/g, "")) || 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ClientDetailPageView({
  params,
  searchParams,
}: ClientDetailPageProps) {
  const { id } = await params;
  const client = await getClientById(id);
  const feedback = getFeedbackFromSearchParams(await searchParams);

  if (!client) {
    notFound();
  }

  const projects = await getProjectsForClient(client.id);
  const activeProjects = projects.filter((project) => project.stage !== "Complete");
  const completedProjects = projects.filter((project) => project.stage === "Complete");
  const activeValue = activeProjects.reduce(
    (sum, project) => sum + parseCurrency(project.contract),
    0,
  );
  const launchReadyCount = projects.filter(
    (project) =>
      project.stage === "Launch Ready" ||
      project.stage === "Payment Requested",
  ).length;

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
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="section-eyebrow">{client.company}</p>
              <h1 className="mt-3 font-display text-5xl leading-none text-[var(--color-soft)]">
                {client.name}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300/78">
                Keep the relationship side of the work visible here: who they
                are, how to reach them, what is active, and where the revenue
                is sitting.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className="btn-primary"
                  href={`/projects/new?clientId=${encodeURIComponent(client.id)}`}
                >
                  New project for this client
                </Link>
                <Link className="btn-secondary" href="/projects">
                  View full board
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[34rem]">
              <div className="rounded-[1.25rem] border border-white/8 bg-white/6 p-4">
                <p className="label">Active projects</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-soft)]">
                  {activeProjects.length}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/8 bg-white/6 p-4">
                <p className="label">Open value</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-soft)]">
                  {formatCurrency(activeValue)}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/8 bg-white/6 p-4">
                <p className="label">Near launch</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-soft)]">
                  {launchReadyCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <section className="panel">
            <div>
              <p className="section-eyebrow">Contact</p>
              <h2 className="section-title">Relationship snapshot</h2>
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-white/8 bg-[var(--color-panel-strong)]/58 p-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="label">Email</p>
                  <p className="mt-2 break-all text-sm text-slate-100/90">
                    {client.email || "Not added yet"}
                  </p>
                </div>
                <div>
                  <p className="label">Phone</p>
                  <p className="mt-2 text-sm text-slate-100/90">
                    {client.phone || "Not added yet"}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="label">Notes</p>
                <p className="mt-2 text-sm leading-7 text-slate-300/80">
                  {client.notes || "No client notes yet."}
                </p>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-eyebrow">Next step</p>
                <h2 className="section-title">Project intake stays one click away</h2>
              </div>
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-white/8 bg-[var(--color-panel-strong)]/58 p-5">
              <p className="text-sm leading-7 text-slate-300/80">
                The main CTA is now up in the hero so it is easier to spot
                right away. You can still jump into a client-prefilled project
                form from here anytime.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  className="btn-secondary"
                  href={`/projects/new?clientId=${encodeURIComponent(client.id)}`}
                >
                  New project for this client
                </Link>
                <Link className="btn-secondary" href="/projects">
                  View full board
                </Link>
              </div>
            </div>
          </section>

          <section className="panel">
            <div>
              <p className="section-eyebrow">Edit client</p>
              <h2 className="section-title">Keep the record current</h2>
            </div>

            <form action={updateClientAction} className="mt-6 space-y-4">
              <input name="id" type="hidden" value={client.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="label">Client name</p>
                  <input
                    className="field mt-2"
                    defaultValue={client.name}
                    minLength={2}
                    name="name"
                    required
                  />
                </div>
                <div>
                  <p className="label">Company</p>
                  <input
                    className="field mt-2"
                    defaultValue={client.company}
                    minLength={2}
                    name="company"
                    required
                  />
                </div>
                <div>
                  <p className="label">Email</p>
                  <input
                    className="field mt-2"
                    defaultValue={client.email}
                    name="email"
                    type="email"
                  />
                </div>
                <div>
                  <p className="label">Phone</p>
                  <input
                    className="field mt-2"
                    defaultValue={client.phone}
                    name="phone"
                    type="tel"
                  />
                </div>
              </div>
              <div>
                <p className="label">Notes</p>
                <textarea
                  className="field-area mt-2"
                  defaultValue={client.notes}
                  name="notes"
                />
              </div>
              <SubmitButton
                className="btn-primary"
                pendingText="Updating client..."
              >
                Save client changes
              </SubmitButton>
            </form>
            <form action={deleteClientAction} className="mt-4 border-t border-white/8 pt-4">
              <input name="id" type="hidden" value={client.id} />
              <ConfirmSubmitButton
                className="inline-flex items-center justify-center rounded-full border border-[rgba(210,98,58,0.38)] bg-[rgba(210,98,58,0.14)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(255,228,214,0.96)] transition hover:bg-[rgba(210,98,58,0.22)]"
                confirmMessage="Delete this client and all linked projects?"
                pendingText="Deleting..."
              >
                Delete client
              </ConfirmSubmitButton>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className="panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-eyebrow">Projects</p>
                <h2 className="section-title">Everything tied to this client</h2>
              </div>
              <Link className="text-link" href="/projects">
                Open full board
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {projects.length === 0 ? (
                <div className="rounded-[1.4rem] border border-dashed border-white/10 px-5 py-6 text-sm text-slate-300/70">
                  No projects are connected to this client yet.
                </div>
              ) : (
                projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block rounded-[1.4rem] border border-white/8 bg-[var(--color-panel-strong)]/58 p-5 transition hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-panel-strong)]/74"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                          {project.stage}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-[var(--color-soft)]">
                          {project.name}
                        </h3>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-100/80">
                        {project.contract}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 text-sm text-slate-300/82 sm:grid-cols-3">
                      <div>
                        <p className="label">Billing</p>
                        <p className="mt-2 text-slate-100/90">
                          {project.paymentStructure}
                        </p>
                      </div>
                      <div>
                        <p className="label">Homepage</p>
                        <p className="mt-2 text-slate-100/90">
                          {project.homepageStatus}
                        </p>
                      </div>
                      <div>
                        <p className="label">Finance</p>
                        <p className="mt-2 text-slate-100/90">
                          {project.paymentStatus}
                          {project.hostingEnabled
                            ? ` • Hosting ${formatCurrency(project.hostingAmount)}/mo`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3 text-sm text-slate-300/74">
                      <span className="label">Overview</span>
                      <p className="mt-2 leading-7">
                        {project.overview || "No overview added yet."}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {completedProjects.length > 0 ? (
            <section className="panel">
              <div>
                <p className="section-eyebrow">History</p>
                <h2 className="section-title">Completed work</h2>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {completedProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="rounded-full border border-[var(--color-accent)]/24 bg-[var(--color-accent)]/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-soft)]/84 transition hover:bg-[var(--color-accent)]/18"
                  >
                    {project.name}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
