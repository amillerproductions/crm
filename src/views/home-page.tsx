import Link from "next/link";
import { DashboardAttentionList } from "@/components/dashboard-attention-list";
import { FlashBanner } from "@/components/flash-banner";
import {
  getClients,
  getProjects,
  getProspects,
  getSuggestedTasks,
  getTasks,
  stages,
} from "@/lib/crm-data";
import { getFeedbackFromSearchParams } from "@/lib/feedback";

type HomePageProps = {
  searchParams?: Promise<{
    message?: string;
    type?: string;
  }>;
};

function formatDueDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [projects, clients, prospects, tasks, suggestedTasks] = await Promise.all([
    getProjects(),
    getClients(),
    getProspects(),
    getTasks(),
    getSuggestedTasks(),
  ]);
  const feedback = getFeedbackFromSearchParams(await searchParams);
  const activeProjects = projects.filter((project) => project.stage !== "Complete");
  const completedProjects = projects.filter((project) => project.stage === "Complete");

  const parseCurrency = (value: string) =>
    Number(value.replace(/[$,\s]/g, "")) || 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const openPipelineValue = activeProjects.reduce(
    (sum, project) => sum + parseCurrency(project.contract),
    0,
  );
  const paymentRequestedValue = activeProjects
    .filter((project) => project.stage === "Payment Requested")
    .reduce((sum, project) => sum + parseCurrency(project.contract), 0);
  const launchReadyCount = activeProjects.filter(
    (project) => project.stage === "Launch Ready",
  ).length;
  const waitingOnClientCount = activeProjects.filter((project) =>
    project.homepageStatus.toLowerCase().includes("waiting"),
  ).length;
  const stalledProjects = activeProjects.filter((project) => {
    const buildLooksSlow =
      project.stage === "Site Build" &&
      project.completedPages <= 1 &&
      project.totalPages >= 4;
    const waitingOnClient = project.homepageStatus
      .toLowerCase()
      .includes("waiting");

    return buildLooksSlow || waitingOnClient;
  }).length;
  const completedValue = completedProjects.reduce(
    (sum, project) => sum + parseCurrency(project.contract),
    0,
  );
  const openTasks = tasks.filter((task) => task.status !== "Done");
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;
  const reminderWindowEnd = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 3,
  );
  const reminderWindowEndKey = `${reminderWindowEnd.getFullYear()}-${String(
    reminderWindowEnd.getMonth() + 1,
  ).padStart(2, "0")}-${String(reminderWindowEnd.getDate()).padStart(2, "0")}`;
  const taskReminders = openTasks
    .filter(
      (task) =>
        task.dueDate &&
        task.dueDate <= reminderWindowEndKey,
    )
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .slice(0, 5);

  const pipelineStats = [
    {
      label: "Open pipeline",
      value: formatCurrency(openPipelineValue),
      detail: `${activeProjects.length} active projects across the board.`,
    },
    {
      label: "Ready to launch",
      value: String(launchReadyCount),
      detail: "Projects that are approved and close to going live.",
    },
    {
      label: "Waiting on client",
      value: String(waitingOnClientCount),
      detail: "Builds paused on copy, approval, or feedback.",
    },
    {
      label: "Active prospects",
      value: String(prospects.length),
      detail: "Potential clients still in outreach, calls, or proposal follow-up.",
    },
    {
      label: "Open tasks",
      value: String(openTasks.length),
      detail: "Reminders and next actions still in play.",
    },
    {
      label: "Auto reminders",
      value: String(suggestedTasks.length),
      detail: "Suggested follow-ups generated from invoices and stale work.",
    },
    {
      label: "Stalled builds",
      value: String(stalledProjects),
      detail: "Projects that look blocked or slow for their current scope.",
    },
    {
      label: "Awaiting payment",
      value: formatCurrency(paymentRequestedValue),
      detail: "Contract value sitting in invoice follow-up.",
    },
  ];

  const stageSummary = stages.map((stage) => {
    const stageProjects = projects.filter((project) => project.stage === stage);
    const stageValue = stageProjects.reduce(
      (sum, project) => sum + parseCurrency(project.contract),
      0,
    );

    return {
      stage,
      count: stageProjects.length,
      value: formatCurrency(stageValue),
    };
  });

  const clientMomentum = clients
    .map((client) => {
      const clientProjects = projects.filter((project) => project.clientId === client.id);
      const activeClientProjects = clientProjects.filter(
        (project) => project.stage !== "Complete",
      );
      const openValue = activeClientProjects.reduce(
        (sum, project) => sum + parseCurrency(project.contract),
        0,
      );

      return {
        client,
        activeCount: activeClientProjects.length,
        openValue,
      };
    })
    .filter((item) => item.activeCount > 0)
    .sort((left, right) => right.openValue - left.openValue)
    .slice(0, 4);
  const todayAtMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const invoiceReminders = activeProjects
    .flatMap((project) =>
      project.invoices.map((invoice) => ({
        ...invoice,
        projectId: project.id,
        projectName: project.name,
        clientName: project.clientName,
      })),
    )
    .filter((invoice) => invoice.status === "Sent" || invoice.status === "Overdue")
    .map((invoice) => {
      const dueDate = invoice.dueDate
        ? new Date(`${invoice.dueDate}T00:00:00`)
        : null;
      const daysUntilDue = dueDate
        ? Math.round((dueDate.getTime() - todayAtMidnight.getTime()) / 86400000)
        : null;

      return { ...invoice, daysUntilDue };
    })
    .filter(
      (invoice) =>
        invoice.status === "Overdue" ||
        (invoice.daysUntilDue !== null && invoice.daysUntilDue <= 7),
    )
    .sort((left, right) => {
      const leftWeight = left.status === "Overdue" ? -100 : left.daysUntilDue ?? 999;
      const rightWeight =
        right.status === "Overdue" ? -100 : right.daysUntilDue ?? 999;
      return leftWeight - rightWeight;
    })
    .slice(0, 5);

  return (
    <div className="space-y-10">
      <FlashBanner message={feedback.message} type={feedback.type} />
      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(81,135,169,0.35),_transparent_40%),linear-gradient(135deg,_rgba(24,54,72,0.95),_rgba(13,21,29,0.98))] p-8 shadow-[0_30px_80px_rgba(1,8,13,0.45)]">
          <p className="text-sm uppercase tracking-[0.35em] text-[var(--color-soft)]/70">
            KAGE Media CRM
          </p>
          <div className="mt-6 max-w-2xl space-y-4">
            <h1 className="font-display text-5xl leading-none text-[var(--color-soft)] sm:text-6xl">
              Clean control over every web project.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-200/82">
              A focused pipeline for leads, outreach, site builds, launches,
              payments, and the credentials that keep everything moving.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn-primary" href="/projects">
              Open project board
            </Link>
            <Link className="btn-secondary" href="/clients">
              View clients
            </Link>
            <Link className="btn-secondary" href="/prospects">
              View prospects
            </Link>
            <Link className="btn-secondary" href="/tasks">
              View tasks
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {pipelineStats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur-sm"
              >
                <p className="text-sm uppercase tracking-[0.22em] text-slate-300/70">
                  {stat.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-slate-300/72">{stat.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="panel space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--color-accent)]">
                Money
              </p>
              <h2 className="mt-2 font-display text-3xl text-[var(--color-soft)]">
                Revenue snapshot
              </h2>
            </div>
            <Link className="text-link" href="/finance">
              Open finance
            </Link>
          </div>
          <div className="space-y-3">
            {[
              {
                label: "Open contract value",
                value: formatCurrency(openPipelineValue),
                detail: "Everything still in progress or awaiting payment.",
              },
              {
                label: "Completed value",
                value: formatCurrency(completedValue),
                detail: `${completedProjects.length} completed project${completedProjects.length === 1 ? "" : "s"} tracked so far.`,
              },
              {
                label: "Launch + payment queue",
                value: String(
                  activeProjects.filter(
                    (project) =>
                      project.stage === "Launch Ready" ||
                      project.stage === "Payment Requested",
                  ).length,
                ),
                detail: "Projects closest to launch day or money collection.",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.25rem] border border-white/8 bg-[var(--color-panel-strong)]/55 px-4 py-4"
              >
                <p className="label">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-soft)]">
                  {item.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300/74">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-eyebrow">Needs attention</p>
              <h2 className="section-title">What should move next</h2>
            </div>
            <Link className="text-link" href="/projects">
              See full board
            </Link>
          </div>
          <DashboardAttentionList projects={activeProjects} />
        </div>

        <div className="panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-eyebrow">Pipeline health</p>
              <h2 className="section-title">Where the work is sitting</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            {stageSummary.map((item) => (
              <div
                key={item.stage}
                className="flex items-start gap-3 rounded-[1.25rem] border border-white/8 bg-[var(--color-panel-strong)]/55 px-4 py-4"
              >
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm leading-6 text-slate-200/90">
                      {item.stage}
                    </p>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-300/64">
                      {item.count} project{item.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300/70">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-eyebrow">Invoice reminders</p>
              <h2 className="section-title">What needs finance follow-up</h2>
            </div>
            <Link className="text-link" href="/finance">
              Open finance
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {invoiceReminders.length === 0 ? (
              <div className="rounded-[1.35rem] border border-dashed border-white/10 px-5 py-6 text-sm text-slate-300/72">
                No invoice reminders are pressing right now.
              </div>
            ) : (
              invoiceReminders.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/projects/${invoice.projectId}`}
                  className="block rounded-[1.35rem] border border-white/8 bg-[var(--color-panel-strong)]/62 p-5 transition hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-panel-strong)]/78"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                        {invoice.clientName}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[var(--color-soft)]">
                        {invoice.number} · {invoice.title}
                      </h3>
                    </div>
                    <span className="rounded-full border border-[rgba(210,98,58,0.38)] bg-[rgba(210,98,58,0.14)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[rgba(255,228,214,0.96)]">
                      {invoice.status === "Overdue"
                        ? "Overdue"
                        : invoice.daysUntilDue === 0
                          ? "Due today"
                          : `Due in ${invoice.daysUntilDue}d`}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-slate-300/74">
                    {invoice.projectName}
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="label">Amount</p>
                      <p className="mt-1 text-sm text-slate-100/90">
                        {formatCurrency(invoice.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="label">Due date</p>
                      <p className="mt-1 text-sm text-slate-100/90">
                        {invoice.dueDate || "Not set"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-eyebrow">Auto reminders</p>
              <h2 className="section-title">Suggested next moves</h2>
            </div>
            <Link className="text-link" href="/tasks">
              Open tasks
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {suggestedTasks.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-white/10 px-5 py-6 text-sm text-slate-300/72">
                Nothing is being auto-suggested right now.
              </div>
            ) : (
              suggestedTasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href={task.projectId ? `/projects/${task.projectId}` : "/tasks"}
                  className="block rounded-[1.35rem] border border-white/8 bg-[var(--color-panel-strong)]/62 p-5 transition hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-panel-strong)]/78"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                        {task.reason === "invoice-overdue"
                          ? "Overdue invoice"
                          : task.reason === "project-follow-up"
                            ? "Project follow-up"
                            : task.reason === "project-stale"
                              ? "Stale project"
                              : "Prospect follow-up"}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-[var(--color-soft)]">
                        {task.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-300/74">
                        {task.details || "No extra task note yet."}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-100/80">
                      {task.dueDate < todayKey
                        ? "Overdue"
                        : task.dueDate === todayKey
                          ? "Due today"
                          : formatDueDate(task.dueDate)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-eyebrow">Tasks</p>
              <h2 className="section-title">Due soon</h2>
            </div>
            <Link className="text-link" href="/tasks">
              Open tasks
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {taskReminders.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-white/10 px-5 py-6 text-sm text-slate-300/72">
                No upcoming task reminders right now.
              </div>
            ) : (
              taskReminders.map((task) => (
                <Link
                  key={task.id}
                  href="/tasks"
                  className="block rounded-[1.35rem] border border-white/8 bg-[var(--color-panel-strong)]/62 p-5 transition hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-panel-strong)]/78"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                        {task.priority} priority
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-[var(--color-soft)]">
                        {task.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-300/74">
                        {task.details || "No extra task note yet."}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-100/80">
                      {task.dueDate < todayKey
                        ? "Overdue"
                        : task.dueDate === todayKey
                          ? "Due today"
                          : formatDueDate(task.dueDate)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-eyebrow">Client momentum</p>
              <h2 className="section-title">Who carries the most open work</h2>
            </div>
            <Link className="text-link" href="/clients">
              Open clients
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {clientMomentum.map((item) => (
              <Link
                key={item.client.id}
                href={`/clients/${item.client.id}`}
                className="block rounded-[1.35rem] border border-white/8 bg-[var(--color-panel-strong)]/62 p-5 transition hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-panel-strong)]/78"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                      {item.client.company}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--color-soft)]">
                      {item.client.name}
                    </h3>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-100/80">
                    {formatCurrency(item.openValue)}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300/78">
                  {item.activeCount} active project{item.activeCount === 1 ? "" : "s"} connected
                  to this client right now.
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="panel xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-eyebrow">Quick view</p>
              <h2 className="section-title">Launch and payment queue</h2>
            </div>
            <Link className="text-link" href="/projects?stage=Launch%20Ready">
              Focus launches
            </Link>
          </div>
          <div className="mt-6 grid gap-4">
            {activeProjects
              .filter(
                (project) =>
                  project.stage === "Launch Ready" ||
                  project.stage === "Payment Requested",
              )
              .slice(0, 5)
              .map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block rounded-[1.25rem] border border-white/8 bg-[var(--color-panel-strong)]/55 px-4 py-4 transition hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-panel-strong)]/74"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                        {project.clientName}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-[var(--color-soft)]">
                        {project.name}
                      </h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-100/80">
                      {project.stage}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="label">Payment</p>
                      <p className="mt-1 text-sm text-slate-100/90">
                        {project.paymentStatus}
                      </p>
                    </div>
                    <div>
                      <p className="label">Contract</p>
                      <p className="mt-1 text-sm text-slate-100/90">
                        {project.contract}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
