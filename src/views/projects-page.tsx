import Link from "next/link";
import { FlashBanner } from "@/components/flash-banner";
import { getPaymentMilestoneCount, type PaymentStructure } from "@/lib/mock-data";
import { getProjects, stages } from "@/lib/crm-data";
import { getFeedbackFromSearchParams } from "@/lib/feedback";
import { normalizeExternalUrl } from "@/lib/url";

const expandedStages = new Set(["Site Build", "Launch Ready"]);

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

function getStageSignals(
  stage: string,
  stageProjects: {
    paymentStructure: PaymentStructure;
    installmentCount: number;
    paymentsReceivedCount: number;
    homepageStatus: string;
    completedPages: number;
    totalPages: number;
  }[],
  stageTotal: number,
) {
  if (stageProjects.length === 0) {
    return [{ label: "Clear", tone: "neutral" as const }];
  }

  const waitingCount = stageProjects.filter((project) =>
    project.homepageStatus.toLowerCase().includes("waiting"),
  ).length;
  const unpaidCount = stageProjects.filter(
    (project) =>
      project.paymentsReceivedCount <
      getPaymentMilestoneCount(
        project.paymentStructure,
        project.installmentCount,
      ),
  ).length;
  const readyCount = stageProjects.filter(
    (project) => project.completedPages >= Math.max(project.totalPages - 2, 1),
  ).length;

  switch (stage) {
    case "Lead Found":
      return [
        { label: "Needs outreach", tone: "attention" as const },
        { label: `${stageProjects.length} fresh leads`, tone: "neutral" as const },
      ];
    case "Outreach / Offer Sent":
      return [
        { label: "Waiting on replies", tone: "warning" as const },
        { label: `${formatCurrency(stageTotal)} quoted`, tone: "neutral" as const },
      ];
    case "Site Build":
      return [
        waitingCount > 0
          ? { label: `${waitingCount} waiting on client`, tone: "warning" as const }
          : { label: "Build moving", tone: "positive" as const },
        { label: `${readyCount} nearing finish`, tone: "neutral" as const },
      ];
    case "Launch Ready":
      return [
        { label: "Ready to schedule", tone: "positive" as const },
        unpaidCount > 0
          ? { label: `${unpaidCount} with balance open`, tone: "attention" as const }
          : { label: "Payment clear", tone: "neutral" as const },
      ];
    case "Payment Requested":
      return [
        { label: "Needs follow-up", tone: "attention" as const },
        { label: `${unpaidCount} invoices open`, tone: "warning" as const },
      ];
    default:
      return [{ label: "In progress", tone: "neutral" as const }];
  }
}

function chipClasses(tone: "neutral" | "attention" | "warning" | "positive") {
  switch (tone) {
    case "attention":
      return "border-[rgba(210,98,58,0.38)] bg-[rgba(210,98,58,0.16)] text-[rgba(255,228,214,0.96)]";
    case "warning":
      return "border-[rgba(224,150,63,0.34)] bg-[rgba(224,150,63,0.16)] text-[rgba(255,238,210,0.96)]";
    case "positive":
      return "border-[rgba(81,169,130,0.28)] bg-[rgba(81,169,130,0.14)] text-[rgba(222,245,229,0.92)]";
    default:
      return "border-white/10 bg-white/6 text-slate-100/78";
  }
}

type ProjectsPageViewProps = {
  searchParams?: Promise<{
    q?: string;
    sort?: string;
    stage?: string;
    message?: string;
    type?: string;
  }>;
};

export default async function ProjectsPageView({
  searchParams,
}: ProjectsPageViewProps) {
  const params = await searchParams;
  const projects = await getProjects();
  const feedback = getFeedbackFromSearchParams(params);
  const query = params?.q?.trim() ?? "";
  const normalizedQuery = query.toLowerCase();
  const sort = params?.sort?.trim() ?? "stage";
  const stageFilter = params?.stage?.trim() ?? "All";
  const boardStages = stages.filter((stage) => stage !== "Complete");
  const filteredProjects = projects.filter((project) => {
    const matchesQuery = normalizedQuery
      ? [
          project.name,
          project.clientName,
          project.stage,
          project.paymentStructure,
          project.paymentStatus,
          project.hostingEnabled ? "hosting charged" : "no hosting",
          String(project.hostingAmount),
          project.homepageStatus,
          project.workingUrl,
          project.liveUrl,
          project.overview,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      : true;
    const matchesStage =
      stageFilter === "All" ? true : project.stage === stageFilter;

    return matchesQuery && matchesStage;
  });
  const activeProjects = filteredProjects.filter((project) => project.stage !== "Complete");
  const completedProjects = filteredProjects.filter((project) => project.stage === "Complete");
  const sortProjects = (items: typeof filteredProjects) =>
    [...items].sort((left, right) => {
      switch (sort) {
        case "project-asc":
          return left.name.localeCompare(right.name);
        case "project-desc":
          return right.name.localeCompare(left.name);
        case "client-asc":
          return left.clientName.localeCompare(right.clientName);
        case "value-desc":
          return parseCurrency(right.contract) - parseCurrency(left.contract);
        case "value-asc":
          return parseCurrency(left.contract) - parseCurrency(right.contract);
        case "stage":
        default:
          return stages.indexOf(left.stage) - stages.indexOf(right.stage);
      }
    });
  const sortedActiveProjects = sortProjects(activeProjects);
  const sortedCompletedProjects = sortProjects(completedProjects);
  const visibleBoardStages =
    stageFilter === "All"
      ? boardStages
      : boardStages.filter((stage) => stage === stageFilter);

  return (
    <div className="space-y-8">
      <FlashBanner message={feedback.message} type={feedback.type} />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-eyebrow">Projects board</p>
          <h1 className="section-title">Lead to launch in one pipeline</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/76">
            This board is grouped into collapsible stage queues so each section
            has room to breathe while still keeping the whole workflow visible.
          </p>
        </div>
        <Link className="btn-primary" href="/projects/new">
          New project
        </Link>
      </header>

      <section className="panel">
        <form className="space-y-3" method="get">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_16rem_auto] xl:items-end">
            <div className="min-w-0">
              <p className="label">Search projects</p>
              <input
                className="field mt-2"
                defaultValue={query}
                name="q"
                placeholder="Search by project, client, stage, payment status, URL, or overview"
              />
            </div>
            <div className="min-w-0">
              <p className="label">Stage filter</p>
              <select className="field-select mt-2" defaultValue={stageFilter} name="stage">
                <option value="All">All stages</option>
                {stages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0 xl:col-start-2 xl:row-start-2">
              <p className="label">Sort</p>
              <select className="field-select mt-2" defaultValue={sort} name="sort">
                <option value="stage">Stage order</option>
                <option value="project-asc">Project name A-Z</option>
                <option value="project-desc">Project name Z-A</option>
                <option value="client-asc">Client name A-Z</option>
                <option value="value-desc">Highest contract value</option>
                <option value="value-asc">Lowest contract value</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-3 xl:justify-end">
              <button className="btn-secondary" type="submit">
                Apply
              </button>
              {query || stageFilter !== "All" || sort !== "stage" ? (
                <Link className="btn-secondary" href="/projects">
                  Clear
                </Link>
              ) : null}
            </div>
          </div>
          <p className="field-hint">
            Great for quickly finding one project or narrowing the board.
          </p>
        </form>
      </section>

      <section className="space-y-4">
        {visibleBoardStages.length === 0 && completedProjects.length === 0 ? (
          <div className="panel">
            <p className="section-eyebrow">No matches</p>
            <h2 className="section-title">No projects matched those filters</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300/76">
              Try a different project name, client, stage, or clear the filters
              to return to the full board.
            </p>
          </div>
        ) : null}

        {visibleBoardStages.map((stage) => {
          const stageProjects = sortedActiveProjects.filter((project) => project.stage === stage);
          const stageTotal = stageProjects.reduce((sum, project) => sum + parseCurrency(project.contract), 0);
          const isOpen = expandedStages.has(stage);
          const signals = getStageSignals(stage, stageProjects, stageTotal);

          return (
            <details
              key={stage}
              open={isOpen}
              className="group rounded-[1.75rem] border border-white/8 bg-[var(--color-panel)]/88 shadow-[0_18px_45px_rgba(1,8,13,0.28)]"
            >
              <summary className="flex cursor-pointer list-none flex-col gap-4 p-5 marker:content-none sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/14 text-sm font-semibold text-[var(--color-soft)]">
                    {stageProjects.length}
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-soft)]">
                      {stage}
                    </h2>
                    <p className="mt-1 text-sm text-slate-300/72">
                      {stageProjects.length === 0 ? "No projects in this stage" : `${formatCurrency(stageTotal)} in tracked value`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start sm:max-w-[42rem] sm:justify-end sm:self-center">
                  {signals.map((signal) => (
                    <span key={signal.label} className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${chipClasses(signal.tone)}`}>
                      {signal.label}
                    </span>
                  ))}
                  <span className="rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/8 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--color-soft)]/82">
                    {isOpen ? "Open now" : "Collapsed"}
                  </span>
                </div>
              </summary>
              <div className="border-t border-white/8 px-5 pb-5 pt-4">
                {stageProjects.length === 0 ? (
                  <div className="rounded-[1.25rem] border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                    No projects in this stage yet.
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {stageProjects.map((project) => {
                      const workingUrl = normalizeExternalUrl(project.workingUrl);

                      return (
                      <article
                        key={project.id}
                        className="rounded-[1.3rem] border border-white/8 bg-[var(--color-panel-strong)]/72 p-4 transition hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-panel-strong)]/86"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)]">
                              {project.clientName}
                            </p>
                            <Link
                              href={`/projects/${project.id}`}
                              className="mt-1 inline-block text-lg font-semibold leading-7 text-[var(--color-soft)] transition hover:text-[var(--color-accent)]"
                            >
                              {project.name}
                            </Link>
                          </div>
                          <span className="shrink-0 rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-100/70">
                            {project.contract}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-[1rem] border border-white/6 bg-black/10 px-3 py-3">
                            <p className="label">Pages</p>
                            <p className="mt-1 text-sm font-semibold text-slate-100/90">
                              {project.completedPages}/{project.totalPages}
                            </p>
                          </div>
                          <div className="rounded-[1rem] border border-white/6 bg-black/10 px-3 py-3">
                            <p className="label">Billing</p>
                            <p className="mt-1 truncate text-sm font-semibold text-slate-100/90">
                              {project.paymentStructure}
                            </p>
                          </div>
                          <div className="rounded-[1rem] border border-white/6 bg-black/10 px-3 py-3 sm:col-span-1">
                            <p className="label">URL</p>
                            {workingUrl ? (
                              <a
                                className="mt-1 block truncate text-sm font-semibold text-slate-100/90 underline decoration-white/10 underline-offset-4 transition hover:text-[var(--color-accent)]"
                                href={workingUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {project.workingUrl}
                              </a>
                            ) : (
                              <p className="mt-1 truncate text-sm font-semibold text-slate-100/90">
                                {project.workingUrl}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 rounded-[1rem] border border-white/6 bg-white/[0.03] px-3 py-3">
                          <p className="label">Finance status</p>
                          <p className="mt-1 text-sm text-slate-100/88">
                            {project.paymentStatus}
                            {project.hostingEnabled
                              ? ` • Hosting ${formatCurrency(project.hostingAmount)}/mo`
                              : ""}
                          </p>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Link className="text-link" href={`/projects/${project.id}`}>
                            Open project
                          </Link>
                        </div>
                      </article>
                    );
                    })}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </section>

      <section className="panel">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-eyebrow">Completed</p>
            <h2 className="section-title">Finished and paid projects</h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-100/80">
            {completedProjects.length} archived
          </span>
        </div>
        {sortedCompletedProjects.length === 0 ? (
          <div className="mt-6 rounded-[1.25rem] border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
            No completed projects match the current filters.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {sortedCompletedProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-[1.35rem] border border-white/8 bg-[var(--color-panel-strong)]/62 p-5 transition hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-panel-strong)]/78"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                      {project.clientName}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--color-soft)]">
                      {project.name}
                    </h3>
                  </div>
                  <span className="rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--color-soft)]/88">
                    {project.paymentStatus}
                  </span>
                </div>
                <div className="mt-4 grid gap-4 text-sm text-slate-300/78 sm:grid-cols-3">
                  <div>
                    <p className="label">Contract</p>
                    <p className="mt-1 text-slate-100/88">{project.contract}</p>
                  </div>
                  <div>
                    <p className="label">Pages complete</p>
                    <p className="mt-1 text-slate-100/88">
                      {project.completedPages}/{project.totalPages}
                    </p>
                  </div>
                  <div>
                    <p className="label">Hosting</p>
                    <p className="mt-1 text-slate-100/88">
                      {project.hostingEnabled
                        ? `${formatCurrency(project.hostingAmount)}/mo`
                        : "Not charged"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
