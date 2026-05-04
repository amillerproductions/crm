import Link from "next/link";
import { FlashBanner } from "@/components/flash-banner";
import { getProjects, getProspects } from "@/lib/crm-data";
import { getFeedbackFromSearchParams } from "@/lib/feedback";
import { getPaymentMilestoneCount } from "@/lib/mock-data";

type FinancePageProps = {
  searchParams?: Promise<{
    message?: string;
    type?: string;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatEntryDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatDueDate(value: string) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatMonthLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}-01T12:00:00`));
}

export default async function FinancePageView({
  searchParams,
}: FinancePageProps) {
  const feedback = getFeedbackFromSearchParams(await searchParams);
  const [projects, prospects] = await Promise.all([
    getProjects(),
    getProspects(),
  ]);

  const projectFinance = projects.map((project) => {
    const paymentMilestones = getPaymentMilestoneCount(
      project.paymentStructure,
      project.installmentCount,
    );
    const paymentEntryCount = project.financeEntries.filter(
      (entry) => entry.kind === "Payment received",
    ).length;
    const paymentsReceived = Math.min(project.paymentsReceivedCount, paymentMilestones);
    const collectedFromLedger = project.financeEntries.reduce((sum, entry) => {
      if (entry.kind === "Payment received") {
        return sum + entry.amount;
      }

      if (entry.kind === "Refund") {
        return sum - entry.amount;
      }

      return sum;
    }, 0);
    const collectedAmount =
      paymentEntryCount > 0
        ? collectedFromLedger
        : paymentMilestones > 0
          ? (project.contractAmount * paymentsReceived) / paymentMilestones
          : 0;
    const outstandingAmount = Math.max(
      project.contractAmount - collectedAmount,
      0,
    );

    return {
      ...project,
      paymentMilestones,
      paymentsReceived,
      collectedAmount,
      outstandingAmount,
    };
  });

  const activeProjects = projectFinance.filter((project) => project.stage !== "Complete");
  const invoiceRecords = projectFinance.flatMap((project) =>
    project.invoices.map((invoice) => ({
      ...invoice,
      projectId: project.id,
      projectName: project.name,
      clientName: project.clientName,
    })),
  );
  const unpaidProjects = projectFinance
    .filter((project) => project.outstandingAmount > 0)
    .sort((left, right) => right.outstandingAmount - left.outstandingAmount);
  const overdueProjects = projectFinance.filter(
    (project) => project.overdueInvoicesCount > 0,
  );
  const hostingProjects = projectFinance
    .filter((project) => project.hostingEnabled && project.hostingAmount > 0)
    .sort((left, right) => right.hostingAmount - left.hostingAmount);
  const recentActivity = projectFinance
    .flatMap((project) =>
      project.financeEntries.map((entry) => ({
        projectId: project.id,
        projectName: project.name,
        clientName: project.clientName,
        ...entry,
      })),
    )
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 8);
  const allLedgerEntries = projectFinance.flatMap((project) =>
    project.financeEntries.map((entry) => ({
      projectId: project.id,
      projectName: project.name,
      clientName: project.clientName,
      ...entry,
    })),
  );
  const monthlyMap = new Map<
    string,
    { label: string; invoiced: number; collected: number }
  >();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const current = new Date();
    current.setMonth(current.getMonth() - offset, 1);
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { label: formatMonthLabel(key), invoiced: 0, collected: 0 });
  }

  invoiceRecords.forEach((invoice) => {
    if (!invoice.sentDate) {
      return;
    }

    const key = invoice.sentDate.slice(0, 7);
    const month = monthlyMap.get(key);
    if (month) {
      month.invoiced += invoice.amount;
    }
  });

  allLedgerEntries.forEach((entry) => {
    if (entry.kind !== "Payment received") {
      return;
    }

    const key = entry.date.slice(0, 7);
    const month = monthlyMap.get(key);
    if (month) {
      month.collected += entry.amount;
    }
  });

  const monthlyPerformance = Array.from(monthlyMap.values());
  const invoiceSnapshot = invoiceRecords.reduce(
    (summary, invoice) => {
      summary.total += 1;
      if (invoice.status === "Draft") summary.draft += 1;
      if (invoice.status === "Sent") summary.sent += 1;
      if (invoice.status === "Paid") summary.paid += 1;
      if (invoice.status === "Overdue") summary.overdue += 1;
      return summary;
    },
    { total: 0, draft: 0, sent: 0, paid: 0, overdue: 0 },
  );

  const totalContracted = projectFinance.reduce(
    (sum, project) => sum + project.contractAmount,
    0,
  );
  const totalCollected = projectFinance.reduce(
    (sum, project) => sum + project.collectedAmount,
    0,
  );
  const totalOutstanding = projectFinance.reduce(
    (sum, project) => sum + project.outstandingAmount,
    0,
  );
  const activePipelineValue = activeProjects.reduce(
    (sum, project) => sum + project.contractAmount,
    0,
  );
  const hostingMonthlyRevenue = hostingProjects.reduce(
    (sum, project) => sum + project.hostingAmount,
    0,
  );
  const averageProjectValue =
    projectFinance.length > 0 ? totalContracted / projectFinance.length : 0;
  const estimatedProspectValue = prospects.reduce(
    (sum, prospect) => sum + prospect.estimatedValue,
    0,
  );
  const valuedProspects = prospects
    .filter((prospect) => prospect.estimatedValue > 0)
    .sort((left, right) => right.estimatedValue - left.estimatedValue);

  const financeStats = [
    {
      label: "Total contracted",
      value: formatCurrency(totalContracted),
      detail: `${projectFinance.length} tracked project${projectFinance.length === 1 ? "" : "s"} across the CRM.`,
    },
    {
      label: "Collected so far",
      value: formatCurrency(totalCollected),
      detail: "Pulled from the ledger when payment entries exist, with a legacy fallback for older records.",
    },
    {
      label: "Outstanding balance",
      value: formatCurrency(totalOutstanding),
      detail: `${unpaidProjects.length} project${unpaidProjects.length === 1 ? "" : "s"} still have money open.`,
    },
    {
      label: "Overdue invoices",
      value: `${overdueProjects.reduce((sum, project) => sum + project.overdueInvoicesCount, 0)}`,
      detail: `${overdueProjects.length} project${overdueProjects.length === 1 ? "" : "s"} currently have overdue invoices.`,
    },
    {
      label: "Hosting MRR",
      value: formatCurrency(hostingMonthlyRevenue),
      detail: `${hostingProjects.length} client${hostingProjects.length === 1 ? "" : "s"} currently paying for hosting.`,
    },
    {
      label: "Active pipeline",
      value: formatCurrency(activePipelineValue),
      detail: `${activeProjects.length} active project${activeProjects.length === 1 ? "" : "s"} not yet completed.`,
    },
    {
      label: "Prospect pipeline",
      value: formatCurrency(estimatedProspectValue),
      detail: `${valuedProspects.length} potential client${valuedProspects.length === 1 ? "" : "s"} with estimated value attached.`,
    },
    {
      label: "Average project",
      value: formatCurrency(averageProjectValue),
      detail: "Useful for quoting rhythm and offer calibration.",
    },
  ];

  return (
    <div className="space-y-8">
      <FlashBanner message={feedback.message} type={feedback.type} />

      <section className="rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,_rgba(81,135,169,0.22),_transparent_34%),linear-gradient(160deg,_rgba(24,54,72,0.95),_rgba(13,21,29,0.98))] p-6 shadow-[0_24px_60px_rgba(1,8,13,0.34)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-eyebrow">Finance</p>
            <h1 className="mt-3 font-display text-5xl leading-none text-[var(--color-soft)]">
              Money at a glance
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300/78">
              This gives you a clean internal finance view now, while keeping the
              project data structured enough to connect Stripe or Square later if
              you decide to automate payment tracking.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[36rem]">
            <div className="rounded-[1.25rem] border border-white/8 bg-white/6 p-4">
              <p className="label">Collected</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-soft)]">
                {formatCurrency(totalCollected)}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-white/8 bg-white/6 p-4">
              <p className="label">Open balance</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-soft)]">
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-white/8 bg-white/6 p-4">
              <p className="label">Hosting MRR</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-soft)]">
                {formatCurrency(hostingMonthlyRevenue)}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-white/8 bg-white/6 p-4">
              <p className="label">Prospect value</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-soft)]">
                {formatCurrency(estimatedProspectValue)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {financeStats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-[1.4rem] border border-white/8 bg-[var(--color-panel-strong)]/62 p-5"
          >
            <p className="label">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-soft)]">
              {stat.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300/72">
              {stat.detail}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-eyebrow">Outstanding</p>
              <h2 className="section-title">What still needs to be collected</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-100/80">
              {unpaidProjects.length} open
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {unpaidProjects.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-white/10 px-5 py-6 text-sm text-slate-300/72">
                No open balances right now.
              </div>
            ) : (
              unpaidProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block rounded-[1.35rem] border border-white/8 bg-[var(--color-panel-strong)]/55 p-5 transition hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-panel-strong)]/74"
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
                    <span className="rounded-full border border-[rgba(210,98,58,0.38)] bg-[rgba(210,98,58,0.14)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[rgba(255,228,214,0.96)]">
                      {formatCurrency(project.outstandingAmount)} open
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-4">
                    <div>
                      <p className="label">Contract</p>
                      <p className="mt-1 text-slate-100/88">{project.contract}</p>
                    </div>
                    <div>
                      <p className="label">Collected</p>
                      <p className="mt-1 text-slate-100/88">
                        {formatCurrency(project.collectedAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="label">Invoices</p>
                      <p className="mt-1 text-slate-100/88">
                        {project.invoiceStatus}
                      </p>
                      {project.overdueInvoicesCount > 0 ? (
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[rgba(255,208,188,0.94)]">
                          {project.overdueInvoicesCount} overdue
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <p className="label">Payments</p>
                      <p className="mt-1 text-slate-100/88">
                        {project.paymentStatus}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-eyebrow">Prospects</p>
                <h2 className="section-title">Estimated prospect amount</h2>
              </div>
              <Link className="text-link" href="/prospects">
                Open prospects
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {valuedProspects.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-white/10 px-5 py-6 text-sm text-slate-300/72">
                  No estimated prospect values are being tracked yet.
                </div>
              ) : (
                valuedProspects.slice(0, 6).map((prospect) => (
                  <Link
                    key={prospect.id}
                    href="/prospects"
                    className="block rounded-[1.2rem] border border-white/8 bg-[var(--color-panel-strong)]/55 px-4 py-4 transition hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-panel-strong)]/72"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-soft)]">
                          {prospect.company}
                        </p>
                        <p className="mt-1 text-sm text-slate-300/72">
                          {prospect.name} • {prospect.status}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[var(--color-soft)]">
                        {formatCurrency(prospect.estimatedValue)}
                      </span>
                    </div>
                    {prospect.nextFollowUp ? (
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-300/64">
                        Follow up {formatDueDate(prospect.nextFollowUp)}
                      </p>
                    ) : null}
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-eyebrow">Invoices</p>
                <h2 className="section-title">Structured invoice snapshot</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-100/80">
                {invoiceSnapshot.total} tracked
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Draft", value: invoiceSnapshot.draft },
                { label: "Sent", value: invoiceSnapshot.sent },
                { label: "Paid", value: invoiceSnapshot.paid },
                { label: "Overdue", value: invoiceSnapshot.overdue },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.2rem] border border-white/8 bg-[var(--color-panel-strong)]/55 px-4 py-4"
                >
                  <p className="label">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--color-soft)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-eyebrow">Hosting</p>
                <h2 className="section-title">Recurring revenue</h2>
              </div>
              <span className="rounded-full border border-[var(--color-accent)]/24 bg-[var(--color-accent)]/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--color-soft)]/84">
                {formatCurrency(hostingMonthlyRevenue)}/mo
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {hostingProjects.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-white/10 px-5 py-6 text-sm text-slate-300/72">
                  No hosting revenue is being tracked yet.
                </div>
              ) : (
                hostingProjects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-[1.2rem] border border-white/8 bg-[var(--color-panel-strong)]/55 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-soft)]">
                          {project.clientName}
                        </p>
                        <p className="mt-1 text-sm text-slate-300/72">
                          {project.name}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[var(--color-soft)]">
                        {formatCurrency(project.hostingAmount)}/mo
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div>
              <p className="section-eyebrow">Monthly view</p>
              <h2 className="section-title">Invoiced vs. collected</h2>
            </div>

            <div className="mt-6 space-y-3">
              {monthlyPerformance.map((month) => (
                <div
                  key={month.label}
                  className="rounded-[1.2rem] border border-white/8 bg-[var(--color-panel-strong)]/55 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-[var(--color-soft)]">
                      {month.label}
                    </p>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-300/64">
                      {formatCurrency(month.invoiced)} invoiced
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="label">Invoiced</p>
                      <p className="mt-1 text-slate-100/88">
                        {formatCurrency(month.invoiced)}
                      </p>
                    </div>
                    <div>
                      <p className="label">Collected</p>
                      <p className="mt-1 text-slate-100/88">
                        {formatCurrency(month.collected)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div>
              <p className="section-eyebrow">Future sync</p>
              <h2 className="section-title">Ready for Stripe or Square later</h2>
            </div>

            <div className="mt-6 grid gap-4">
              {[
                "Payment structure and payment progress are now stored as real fields instead of loose notes.",
                "Hosting revenue is separated out so recurring billing has its own visibility.",
                "A future sync can map invoices, charges, payouts, and subscriptions into this page without rebuilding the finance model.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[1.25rem] border border-white/8 bg-[var(--color-panel-strong)]/55 px-4 py-4"
                >
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                  <p className="text-sm leading-6 text-slate-200/84">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-eyebrow">Recent activity</p>
                <h2 className="section-title">Latest ledger entries</h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {recentActivity.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-white/10 px-5 py-6 text-sm text-slate-300/72">
                  No finance activity has been logged yet.
                </div>
              ) : (
                recentActivity.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/projects/${entry.projectId}`}
                    className="block rounded-[1.2rem] border border-white/8 bg-[var(--color-panel-strong)]/55 px-4 py-4 transition hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-panel-strong)]/72"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                          {formatEntryDate(entry.date)}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-soft)]">
                          {entry.kind}
                        </p>
                        {entry.dueDate ? (
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[rgba(255,208,188,0.78)]">
                            Due {formatDueDate(entry.dueDate)}
                          </p>
                        ) : null}
                        <p className="mt-1 text-sm text-slate-300/72">
                          {entry.clientName} • {entry.projectName}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-[var(--color-soft)]">
                        {entry.amount > 0 ? formatCurrency(entry.amount) : "Note"}
                      </span>
                    </div>
                    {entry.note ? (
                      <p className="mt-3 text-sm leading-6 text-slate-300/76">
                        {entry.note}
                      </p>
                    ) : null}
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
