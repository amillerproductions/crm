import Link from "next/link";
import { notFound } from "next/navigation";
import {
  archiveProjectAction,
  createTaskAction,
  createCredentialAction,
  createFinanceEntryAction,
  createInvoiceAction,
  createProjectPageAction,
  deleteTaskAction,
  deleteCredentialAction,
  deleteFinanceEntryAction,
  deleteInvoiceAction,
  deleteProjectAction,
  deleteProjectPageAction,
  disableInvoiceShareAction,
  enableInvoiceShareAction,
  markInvoiceSentAction,
  regenerateInvoiceShareAction,
  updateTaskAction,
  updateTaskStatusAction,
  updateCredentialAction,
  updateFinanceEntryAction,
  updateInvoiceAction,
  updateProjectAction,
  updateProjectPageAction,
  updateProjectPageStatusAction,
} from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { CopyShareLinkButton } from "@/components/copy-share-link-button";
import { FlashBanner } from "@/components/flash-banner";
import { InvoiceEmailActions } from "@/components/invoice-email-actions";
import { PasswordField } from "@/components/password-field";
import { SubmitButton } from "@/components/submit-button";
import {
  getClientById,
  getProjectById,
  getTasks,
  invoiceStatuses,
  paymentStructures,
} from "@/lib/crm-data";
import { getFeedbackFromSearchParams } from "@/lib/feedback";
import { normalizeExternalUrl } from "@/lib/url";

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

function getInvoiceBadgeClasses(status: string) {
  if (status === "Paid") {
    return "border-[rgba(84,170,126,0.32)] bg-[rgba(84,170,126,0.14)] text-[rgba(225,255,236,0.96)]";
  }

  if (status === "Overdue") {
    return "border-[rgba(210,98,58,0.38)] bg-[rgba(210,98,58,0.14)] text-[rgba(255,228,214,0.96)]";
  }

  if (status === "Sent") {
    return "border-[var(--color-accent)]/22 bg-[var(--color-accent)]/10 text-[var(--color-soft)]";
  }

  return "border-white/10 bg-white/6 text-slate-100/82";
}

function getPageStatusClasses(status: string) {
  if (status === "Complete") {
    return "border-[rgba(84,170,126,0.28)] bg-[rgba(84,170,126,0.14)] text-[rgba(225,255,236,0.96)]";
  }

  if (status === "In progress") {
    return "border-[var(--color-accent)]/22 bg-[var(--color-accent)]/10 text-[var(--color-soft)]";
  }

  return "border-white/10 bg-white/6 text-slate-100/78";
}

function getPageStatusButtonClasses(isActive: boolean, status: string) {
  if (isActive) {
    return `border ${getPageStatusClasses(status)}`;
  }

  return "border border-white/10 bg-black/10 text-slate-300/76 transition hover:border-white/18 hover:text-slate-100/90";
}

function getTaskStatusClasses(status: string) {
  if (status === "Done") {
    return "border-[rgba(84,170,126,0.28)] bg-[rgba(84,170,126,0.14)] text-[rgba(225,255,236,0.96)]";
  }

  if (status === "In progress") {
    return "border-[var(--color-accent)]/22 bg-[var(--color-accent)]/10 text-[var(--color-soft)]";
  }

  if (status === "Waiting") {
    return "border-[rgba(224,150,63,0.34)] bg-[rgba(224,150,63,0.14)] text-[rgba(255,238,210,0.96)]";
  }

  return "border-white/10 bg-white/6 text-slate-100/78";
}

function getTaskPriorityClasses(priority: string) {
  if (priority === "Urgent") {
    return "border-[rgba(210,98,58,0.38)] bg-[rgba(210,98,58,0.14)] text-[rgba(255,228,214,0.96)]";
  }

  if (priority === "High") {
    return "border-[rgba(224,150,63,0.34)] bg-[rgba(224,150,63,0.14)] text-[rgba(255,238,210,0.96)]";
  }

  if (priority === "Low") {
    return "border-white/10 bg-white/6 text-slate-100/72";
  }

  return "border-[rgba(136,190,219,0.24)] bg-[rgba(136,190,219,0.1)] text-[var(--color-soft)]";
}

function buildInvoiceEmailSubject(invoiceNumber: string, projectName: string) {
  return `${invoiceNumber} from KAGE Media for ${projectName}`;
}

function buildInvoiceEmailBody(args: {
  clientName: string;
  dueDate: string;
  invoiceNumber: string;
  invoiceUrl: string;
  projectName: string;
  total: string;
}) {
  const dueLine = args.dueDate ? `The invoice is due on ${args.dueDate}.` : "";

  return [
    `Hi ${args.clientName},`,
    "",
    `I just sent over invoice ${args.invoiceNumber} for ${args.projectName}.`,
    `Total due: ${args.total}.`,
    dueLine,
    "",
    `You can view the invoice here: ${args.invoiceUrl}`,
    "",
    "Let me know if you need anything adjusted.",
    "",
    "Thanks,",
    "KAGE Media",
  ]
    .filter(Boolean)
    .join("\n");
}

const financeEntryKinds = [
  "Invoice sent",
  "Payment received",
  "Hosting billed",
  "Refund",
  "Note",
] as const;

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    message?: string;
    type?: string;
  }>;
};

export default async function ProjectDetailPageView({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const { id } = await params;
  const project = await getProjectById(id);
  const feedback = getFeedbackFromSearchParams(await searchParams);

  if (!project) {
    notFound();
  }

  const client = await getClientById(project.clientId);
  const tasks = (await getTasks())
    .filter((task) => task.projectId === project.id)
    .sort((left, right) => (left.dueDate || "9999-12-31").localeCompare(right.dueDate || "9999-12-31"));
  const hasOverdueInvoices = project.overdueInvoicesCount > 0;
  const newInvoiceRows = Array.from({ length: 3 });
  const workingUrl = normalizeExternalUrl(project.workingUrl);
  const liveUrl = normalizeExternalUrl(project.liveUrl);
  const redirectTo = `/projects/${project.id}`;

  return (
    <div className="space-y-8">
      <FlashBanner message={feedback.message} type={feedback.type} />
      <header className="space-y-5">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--color-accent)] transition hover:text-[var(--color-soft)]"
        >
          <span>Back to projects</span>
        </Link>

        <div className="rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,_rgba(81,135,169,0.22),_transparent_36%),linear-gradient(160deg,_rgba(24,54,72,0.94),_rgba(13,21,29,0.98))] p-6 shadow-[0_24px_60px_rgba(1,8,13,0.34)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="section-eyebrow">{project.clientName}</p>
              <h1 className="mt-3 font-display text-5xl leading-none text-[var(--color-soft)]">
                {project.name}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300/78">
                {project.overview}
              </p>
              {client ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link className="btn-secondary" href={`/clients/${client.id}`}>
                    Open client workspace
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[42rem] xl:grid-cols-4">
              <div className="rounded-[1.25rem] border border-white/8 bg-white/6 p-4">
                <p className="label">Stage</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-soft)]">
                  {project.stage}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/8 bg-white/6 p-4">
                <p className="label">Contract</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-soft)]">
                  {project.contract}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/8 bg-white/6 p-4">
                <p className="label">Payment setup</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-soft)]">
                  {project.paymentStructure}
                  {project.paymentStructure === "Installments" && project.installmentCount > 0
                    ? ` (${project.installmentCount})`
                    : ""}
                </p>
                <p className="mt-1 text-xs text-slate-300/72">{project.paymentStatus}</p>
              </div>
              <div className="rounded-[1.25rem] border border-white/8 bg-white/6 p-4">
                <p className="label">Hosting</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-soft)]">
                  {project.hostingEnabled ? `${formatCurrency(project.hostingAmount)}/mo` : "Not charged"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-eyebrow">Overview</p>
                <h2 className="section-title">Project control panel</h2>
              </div>
            </div>
            <form action={updateProjectAction} className="mt-6 space-y-4">
              <input type="hidden" name="id" value={project.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="label">Project name</p>
                  <input className="field mt-2" name="name" defaultValue={project.name} minLength={2} required />
                </div>
                <div>
                  <p className="label">Stage</p>
                  <select className="field-select mt-2" name="stage" defaultValue={project.stage}>
                    {["Lead Found", "Outreach / Offer Sent", "Site Build", "Launch Ready", "Payment Requested", "Complete"].map((stage) => (
                      <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="label">Working URL</p>
                <input className="field mt-2" name="workingUrl" defaultValue={project.workingUrl} />
                <p className="field-hint">Optional. Use a full URL, a staging label, or leave it blank.</p>
                {workingUrl ? (
                  <a
                    className="mt-2 inline-flex text-xs uppercase tracking-[0.18em] text-[var(--color-accent)] transition hover:text-[var(--color-soft)]"
                    href={workingUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open working site
                  </a>
                ) : null}
              </div>
              <div>
                <p className="label">Live URL</p>
                <input className="field mt-2" name="liveUrl" defaultValue={project.liveUrl} />
                <p className="field-hint">Optional until the project is live.</p>
                {liveUrl ? (
                  <a
                    className="mt-2 inline-flex text-xs uppercase tracking-[0.18em] text-[var(--color-accent)] transition hover:text-[var(--color-soft)]"
                    href={liveUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open live site
                  </a>
                ) : null}
              </div>
              <div className="md:col-span-2">
                <p className="label">Homepage status</p>
                <input className="field mt-2" name="homepageStatus" defaultValue={project.homepageStatus} />
              </div>
              <div>
                <p className="label">Priority</p>
                <select className="field-select mt-2" name="attentionPriority" defaultValue={project.attentionPriority}>
                  {["Low", "Normal", "High", "Urgent"].map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="label">Waiting on</p>
                <input className="field mt-2" name="waitingOn" defaultValue={project.waitingOn} />
              </div>
              <div className="md:col-span-2">
                <p className="label">Follow-up date</p>
                <input className="field mt-2" name="followUpDate" type="date" defaultValue={project.followUpDate} />
              </div>
            </div>

              <div className="rounded-[1.4rem] border border-white/8 bg-[var(--color-panel-strong)]/58 p-5">
                <div>
                  <p className="section-eyebrow">Finance</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[var(--color-soft)]">
                    Contract, payment flow, and hosting
                  </h3>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <p className="label">Contract amount</p>
                  <input className="field mt-2" defaultValue={project.contractAmount} inputMode="decimal" min="0" name="contractAmount" />
                  <p className="field-hint">Keep this numeric so revenue totals stay accurate.</p>
                </div>
                <div>
                  <p className="label">Payment structure</p>
                  <select className="field-select mt-2" name="paymentStructure" defaultValue={project.paymentStructure}>
                    {paymentStructures.map((structure) => (
                      <option key={structure} value={structure}>
                        {structure}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="label">Installment count</p>
                  <input className="field mt-2" defaultValue={project.installmentCount} inputMode="numeric" min="0" name="installmentCount" />
                  <p className="field-hint">Only used when the client is paying in installments.</p>
                </div>
                <div>
                  <p className="label">Invoices sent</p>
                  <div className="field mt-2 flex min-h-[3.5rem] items-center justify-between gap-4">
                    <span className="pr-2">{project.invoiceStatus}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      {hasOverdueInvoices ? (
                        <span className="rounded-full border border-[rgba(210,98,58,0.38)] bg-[rgba(210,98,58,0.14)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[rgba(255,228,214,0.96)]">
                          {project.overdueInvoicesCount} overdue
                        </span>
                      ) : null}
                      <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
                        {project.invoicesIssuedCount}
                      </span>
                    </div>
                  </div>
                  <p className="field-hint">
                    Issued invoice entries and their due dates now drive invoice progress automatically.
                  </p>
                </div>
                <div>
                  <p className="label">Payments received</p>
                  <div className="field mt-2 flex min-h-[3.5rem] items-center justify-between gap-4">
                    <span>{project.paymentStatus}</span>
                    <span className="shrink-0 text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
                      {project.paymentsReceivedCount}
                    </span>
                  </div>
                  <p className="field-hint">Payment received entries in the ledger update this automatically.</p>
                </div>
                <label className="block">
                  <p className="label">Hosting</p>
                  <span className="mt-2 flex min-h-[3.5rem] cursor-pointer items-center justify-between gap-4 rounded-[1rem] border border-white/16 bg-[linear-gradient(180deg,_rgb(8_19_27_/_0.56),_rgb(10_23_32_/_0.72))] px-4 py-3 text-sm text-slate-100/90 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)] transition hover:border-white/22">
                    <span>Charge separately for hosting</span>
                    <input className="h-4 w-4 shrink-0 accent-[var(--color-accent)]" name="hostingEnabled" type="checkbox" defaultChecked={project.hostingEnabled} />
                  </span>
                </label>
                <div>
                  <p className="label">Hosting charge</p>
                  <input className="field mt-2" defaultValue={project.hostingAmount || ""} inputMode="decimal" min="0" name="hostingAmount" />
                  <p className="field-hint">Use the recurring amount you charge, usually monthly.</p>
                </div>
                </div>
              </div>

              <div>
                <p className="label">Overview</p>
                <textarea className="field-area mt-2" name="overview" defaultValue={project.overview} />
              </div>

              <div>
                <p className="label">Homepage notes</p>
                <textarea className="field-area mt-2" name="homepageNotes" defaultValue={project.homepageNotes} />
              </div>
              <div>
                <p className="label">Next action</p>
                <textarea className="field-area mt-2" name="nextAction" defaultValue={project.nextAction} />
              </div>

              <div className="rounded-[1.25rem] border border-white/8 bg-[var(--color-panel-strong)]/58 p-4">
                <p className="label">Pages progress</p>
                <p className="mt-2 text-sm text-slate-100/88">
                  {project.completedPages}/{project.totalPages} complete
                </p>
              </div>

              <SubmitButton className="btn-primary" pendingText="Saving project...">
                Save project changes
              </SubmitButton>

              <div className="flex flex-wrap gap-3 border-t border-white/8 pt-4">
                {project.stage !== "Complete" ? (
                  <SubmitButton
                    className="btn-secondary"
                    formAction={archiveProjectAction}
                    pendingText="Archiving..."
                  >
                    Archive project
                  </SubmitButton>
                ) : null}
              </div>
            </form>

            <form action={deleteProjectAction} className="mt-4 border-t border-white/8 pt-4">
              <input type="hidden" name="id" value={project.id} />
              <ConfirmSubmitButton
                className="inline-flex items-center justify-center rounded-full border border-[rgba(210,98,58,0.38)] bg-[rgba(210,98,58,0.14)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(255,228,214,0.96)] transition hover:bg-[rgba(210,98,58,0.22)]"
                confirmMessage="Delete this project permanently? This cannot be undone."
                pendingText="Deleting..."
              >
                Delete project
              </ConfirmSubmitButton>
            </form>
          </section>

          <section className="panel">
            <div>
              <p className="section-eyebrow">Pages</p>
              <h2 className="section-title">Track the build page by page</h2>
            </div>
            <div className="mt-6 space-y-4">
              <form action={createProjectPageAction} className="rounded-[1.4rem] border border-white/8 bg-[var(--color-panel-strong)]/58 p-5">
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="currentCount" value={project.pageItems.length} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="label">New page title</p>
                    <input className="field mt-2" name="title" minLength={2} required />
                  </div>
                  <div>
                    <p className="label">Status</p>
                    <select className="field-select mt-2" name="status" defaultValue="Not started">
                      {["Not started", "In progress", "Complete"].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="label">Notes</p>
                    <textarea className="field-area mt-2" name="notes" />
                  </div>
                  <div>
                    <p className="label">Issues</p>
                    <textarea className="field-area mt-2" name="issues" />
                  </div>
                </div>
                <SubmitButton className="btn-secondary mt-4" pendingText="Adding page...">
                  Add page item
                </SubmitButton>
              </form>

              {project.pageItems.map((page) => (
                <article
                  key={page.id}
                  className="rounded-[1.4rem] border border-white/8 bg-[var(--color-panel-strong)]/58 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold text-[var(--color-soft)]">
                          {page.title}
                        </h3>
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${getPageStatusClasses(page.status)}`}
                        >
                          {page.status}
                        </span>
                      </div>
                      {page.notes ? (
                        <p className="mt-3 text-sm leading-6 text-slate-300/82">
                          {page.notes}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm leading-6 text-slate-400/62">
                          No page notes yet.
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 lg:min-w-[18rem]">
                      <p className="label">Status</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(["Not started", "In progress", "Complete"] as const).map((status) => (
                          <form key={`${page.id}-${status}`} action={updateProjectPageStatusAction}>
                            <input type="hidden" name="id" value={page.id} />
                            <input type="hidden" name="projectId" value={project.id} />
                            <input type="hidden" name="status" value={status} />
                            <SubmitButton
                              className={`w-full rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.16em] ${getPageStatusButtonClasses(
                                page.status === status,
                                status,
                              )}`}
                              pendingText="Saving..."
                            >
                              {status}
                            </SubmitButton>
                          </form>
                        ))}
                      </div>
                    </div>
                  </div>

                  {page.issues ? (
                    <div className="mt-4 rounded-[1rem] border border-[rgba(210,98,58,0.16)] bg-[rgba(210,98,58,0.07)] px-4 py-3">
                      <p className="label">Issues</p>
                      <p className="mt-2 text-sm leading-6 text-[rgba(255,228,214,0.9)]">
                        {page.issues}
                      </p>
                    </div>
                  ) : null}

                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
                      Edit page content
                    </summary>
                    <form
                      action={updateProjectPageAction}
                      className="mt-4 space-y-4 rounded-[1.25rem] border border-white/8 bg-black/10 p-4"
                    >
                      <input type="hidden" name="id" value={page.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="status" value={page.status} />
                      <div>
                        <p className="label">Page title</p>
                        <input className="field mt-2" name="title" defaultValue={page.title} required />
                      </div>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                          <p className="label">Notes</p>
                          <textarea className="field-area mt-2" name="notes" defaultValue={page.notes} />
                        </div>
                        <div>
                          <p className="label">Issues</p>
                          <textarea
                            className="field-area mt-2"
                            name="issues"
                            defaultValue={page.issues}
                            placeholder="No blockers noted right now."
                          />
                        </div>
                      </div>
                      <SubmitButton className="btn-secondary" pendingText="Saving page...">
                        Save page content
                      </SubmitButton>
                    </form>
                  </details>

                  <form action={deleteProjectPageAction} className="mt-4">
                    <input type="hidden" name="id" value={page.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <ConfirmSubmitButton
                      className="text-xs uppercase tracking-[0.18em] text-[rgba(255,228,214,0.9)] transition hover:text-[rgba(255,200,180,0.98)]"
                      confirmMessage="Delete this page item?"
                      pendingText="Deleting..."
                    >
                      Delete page item
                    </ConfirmSubmitButton>
                  </form>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-eyebrow">Tasks</p>
                <h2 className="section-title">Project-linked reminders and next actions</h2>
              </div>
              <Link className="text-link" href="/tasks">
                Open full task board
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              <details className="rounded-[1.35rem] border border-white/8 bg-[var(--color-panel-strong)]/55 px-4 py-4">
                <summary className="cursor-pointer list-none">
                  <span className="btn-secondary inline-flex">New project task</span>
                </summary>
                <form action={createTaskAction} className="mt-5 space-y-4">
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="clientId" value={project.clientId} />
                  <div>
                    <p className="label">Title</p>
                    <input className="field mt-2" name="title" minLength={2} required />
                  </div>
                  <div>
                    <p className="label">Details</p>
                    <textarea className="field-area mt-2" name="details" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="label">Due date</p>
                      <input className="field mt-2" name="dueDate" type="date" />
                    </div>
                    <div>
                      <p className="label">Status</p>
                      <select className="field-select mt-2" name="status" defaultValue="To do">
                        {["To do", "In progress", "Waiting", "Done"].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="label">Priority</p>
                      <select className="field-select mt-2" name="priority" defaultValue="Normal">
                        {["Low", "Normal", "High", "Urgent"].map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <SubmitButton className="btn-primary" pendingText="Adding task...">
                    Add task
                  </SubmitButton>
                </form>
              </details>

              {tasks.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-white/10 px-5 py-6 text-sm text-slate-300/72">
                  No tasks are linked to this project yet.
                </div>
              ) : (
                tasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-[1.35rem] border border-white/8 bg-[var(--color-panel-strong)]/55 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                          {task.dueDate ? `Due ${formatDueDate(task.dueDate)}` : "No due date"}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-[var(--color-soft)]">
                          {task.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${getTaskPriorityClasses(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${getTaskStatusClasses(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>

                    {task.details ? (
                      <p className="mt-4 text-sm leading-7 text-slate-300/78">
                        {task.details}
                      </p>
                    ) : null}

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(["To do", "In progress", "Waiting", "Done"] as const).map((status) => (
                        <form key={`${task.id}-${status}`} action={updateTaskStatusAction}>
                          <input type="hidden" name="redirectTo" value={redirectTo} />
                          <input type="hidden" name="id" value={task.id} />
                          <input type="hidden" name="status" value={status} />
                          <SubmitButton
                            className={`w-full rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.16em] ${
                              task.status === status
                                ? `border ${getTaskStatusClasses(status)}`
                                : "border border-white/10 bg-black/10 text-slate-300/72 transition hover:border-white/18 hover:text-slate-100/90"
                            }`}
                            pendingText="Moving..."
                          >
                            {status}
                          </SubmitButton>
                        </form>
                      ))}
                    </div>

                    <details className="mt-4">
                      <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
                        Edit task
                      </summary>
                      <form action={updateTaskAction} className="mt-4 space-y-4 rounded-[1rem] border border-white/8 bg-black/10 p-4">
                        <input type="hidden" name="redirectTo" value={redirectTo} />
                        <input type="hidden" name="id" value={task.id} />
                        <input type="hidden" name="projectId" value={project.id} />
                        <input type="hidden" name="clientId" value={project.clientId} />
                        <div>
                          <p className="label">Title</p>
                          <input className="field mt-2" name="title" defaultValue={task.title} minLength={2} required />
                        </div>
                        <div>
                          <p className="label">Details</p>
                          <textarea className="field-area mt-2" name="details" defaultValue={task.details} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div>
                            <p className="label">Due date</p>
                            <input className="field mt-2" name="dueDate" type="date" defaultValue={task.dueDate} />
                          </div>
                          <div>
                            <p className="label">Status</p>
                            <select className="field-select mt-2" name="status" defaultValue={task.status}>
                              {["To do", "In progress", "Waiting", "Done"].map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <p className="label">Priority</p>
                            <select className="field-select mt-2" name="priority" defaultValue={task.priority}>
                              {["Low", "Normal", "High", "Urgent"].map((priority) => (
                                <option key={priority} value={priority}>
                                  {priority}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <SubmitButton className="btn-secondary" pendingText="Updating task...">
                          Update task
                        </SubmitButton>
                      </form>
                      <form action={deleteTaskAction} className="mt-4">
                        <input type="hidden" name="redirectTo" value={redirectTo} />
                        <input type="hidden" name="id" value={task.id} />
                        <ConfirmSubmitButton
                          className="text-xs uppercase tracking-[0.18em] text-[rgba(255,228,214,0.9)] transition hover:text-[rgba(255,200,180,0.98)]"
                          confirmMessage="Delete this task?"
                          pendingText="Deleting..."
                        >
                          Delete task
                        </ConfirmSubmitButton>
                      </form>
                    </details>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div>
              <p className="section-eyebrow">Invoices</p>
              <h2 className="section-title">Structured invoices for this project</h2>
            </div>
            <div className="mt-6 space-y-4">
              <form
                action={createInvoiceAction}
                className="rounded-[1.4rem] border border-white/8 bg-[var(--color-panel-strong)]/58 p-5"
              >
                <input type="hidden" name="projectId" value={project.id} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="label">Invoice number</p>
                    <input className="field mt-2" name="invoiceNumber" placeholder="KAGE-1012" required />
                  </div>
                  <div>
                    <p className="label">Title</p>
                    <input className="field mt-2" name="title" placeholder="Final launch invoice" required />
                  </div>
                  <div>
                    <p className="label">Amount</p>
                    <input className="field mt-2" name="amount" inputMode="decimal" min="0" placeholder="1900" />
                    <p className="field-hint">Used only if you leave line items empty.</p>
                  </div>
                  <div>
                    <p className="label">Status</p>
                    <select className="field-select mt-2" name="status" defaultValue="Draft">
                      {invoiceStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="label">Sent date</p>
                    <input className="field mt-2" name="sentDate" type="date" />
                  </div>
                  <div>
                    <p className="label">Due date</p>
                    <input className="field mt-2" name="dueDate" type="date" />
                  </div>
                  <div>
                    <p className="label">Paid date</p>
                    <input className="field mt-2" name="paidDate" type="date" />
                  </div>
                  <div className="lg:col-span-2">
                    <p className="label">Notes</p>
                    <textarea className="field-area mt-2" name="notes" />
                  </div>
                  <div className="lg:col-span-2">
                    <p className="label">Line items</p>
                    <div className="mt-3 space-y-3 rounded-[1rem] border border-white/8 bg-black/10 p-4">
                      {newInvoiceRows.map((_, index) => (
                        <div key={`new-line-item-${index}`} className="grid gap-3 lg:grid-cols-[1.25fr_0.35fr_0.45fr]">
                          <input
                            className="field"
                            name="lineItemDescription"
                            placeholder="Website design deposit"
                          />
                          <input
                            className="field"
                            name="lineItemQuantity"
                            inputMode="decimal"
                            min="0"
                            placeholder="1"
                          />
                          <input
                            className="field"
                            name="lineItemUnitPrice"
                            inputMode="decimal"
                            min="0"
                            placeholder="1900"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="field-hint">If you add line items, the invoice total is calculated automatically.</p>
                  </div>
                </div>
                <SubmitButton className="btn-secondary mt-4" pendingText="Creating invoice...">
                  Add invoice
                </SubmitButton>
              </form>

              {project.invoices.length === 0 ? (
                <div className="rounded-[1.4rem] border border-dashed border-white/10 px-5 py-6 text-sm text-slate-300/70">
                  No structured invoices have been created for this project yet.
                </div>
              ) : (
                project.invoices.map((invoice) => {
                  const remainingAmount = Math.max(
                    invoice.amount - invoice.linkedPaymentsTotal,
                    0,
                  );
                  const invoiceUrl = `/invoices/${project.id}/${invoice.id}`;
                  const emailSubject = buildInvoiceEmailSubject(
                    invoice.number,
                    project.name,
                  );
                  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/invoices/share/${invoice.shareToken}`;
                  const emailBody = buildInvoiceEmailBody({
                    clientName: client?.name ?? project.clientName,
                    dueDate: invoice.dueDate ? formatDueDate(invoice.dueDate) : "",
                    invoiceNumber: invoice.number,
                    invoiceUrl: invoice.shareEnabled
                      ? shareUrl
                      : `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}${invoiceUrl}`,
                    projectName: project.name,
                    total: formatCurrency(invoice.amount),
                  });

                  return (
                    <article
                      key={invoice.id}
                      className="rounded-[1.4rem] border border-white/8 bg-[var(--color-panel-strong)]/58 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                            {invoice.number}
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-[var(--color-soft)]">
                            {invoice.title}
                          </h3>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${getInvoiceBadgeClasses(invoice.status)}`}
                        >
                          {invoice.status}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-4">
                        <div>
                          <p className="label">Amount</p>
                          <p className="mt-1 text-slate-100/88">
                            {formatCurrency(invoice.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="label">Paid against it</p>
                          <p className="mt-1 text-slate-100/88">
                            {formatCurrency(invoice.linkedPaymentsTotal)}
                          </p>
                        </div>
                        <div>
                          <p className="label">Remaining</p>
                          <p className="mt-1 text-slate-100/88">
                            {formatCurrency(remainingAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="label">Due</p>
                          <p className="mt-1 text-slate-100/88">
                            {formatDueDate(invoice.dueDate)}
                          </p>
                        </div>
                      </div>

                      {invoice.lineItems.length > 0 ? (
                        <div className="mt-4 rounded-[1rem] border border-white/8 bg-black/10 px-4 py-4">
                          <p className="label">Line items</p>
                          <div className="mt-3 space-y-3">
                            {invoice.lineItems.map((item) => (
                              <div
                                key={item.id}
                                className="grid gap-3 text-sm text-slate-300/82 sm:grid-cols-[1.2fr_0.35fr_0.45fr_0.55fr]"
                              >
                                <p>{item.description}</p>
                                <p>{item.quantity}</p>
                                <p>{formatCurrency(item.unitPrice)}</p>
                                <p className="text-slate-100/88">{formatCurrency(item.amount)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {invoice.notes ? (
                        <div className="mt-4 rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
                          <p className="label">Notes</p>
                          <p className="mt-2 text-sm leading-6 text-slate-300/82">
                            {invoice.notes}
                          </p>
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href={invoiceUrl}
                          className="btn-secondary"
                        >
                          Open invoice document
                        </Link>
                        <InvoiceEmailActions
                          body={emailBody}
                          recipient={client?.email ?? ""}
                          subject={emailSubject}
                        />
                        <form action={markInvoiceSentAction}>
                          <input type="hidden" name="projectId" value={project.id} />
                          <input type="hidden" name="id" value={invoice.id} />
                          <input type="hidden" name="currentStatus" value={invoice.status} />
                          <input type="hidden" name="currentSentDate" value={invoice.sentDate} />
                          <SubmitButton className="btn-secondary" pendingText="Marking...">
                            {invoice.sentDate ? "Resent / confirmed sent" : "Mark as sent"}
                          </SubmitButton>
                        </form>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3">
                        {invoice.shareEnabled ? (
                          <>
                            <Link href={shareUrl} className="btn-secondary" target="_blank">
                              Open public invoice
                            </Link>
                            <CopyShareLinkButton className="btn-secondary" url={shareUrl} />
                            <form action={regenerateInvoiceShareAction}>
                              <input type="hidden" name="projectId" value={project.id} />
                              <input type="hidden" name="id" value={invoice.id} />
                              <SubmitButton className="btn-secondary" pendingText="Regenerating...">
                                Regenerate share link
                              </SubmitButton>
                            </form>
                            <form action={disableInvoiceShareAction}>
                              <input type="hidden" name="projectId" value={project.id} />
                              <input type="hidden" name="id" value={invoice.id} />
                              <SubmitButton className="btn-secondary" pendingText="Disabling...">
                                Disable share link
                              </SubmitButton>
                            </form>
                          </>
                        ) : (
                          <form action={enableInvoiceShareAction}>
                            <input type="hidden" name="projectId" value={project.id} />
                            <input type="hidden" name="id" value={invoice.id} />
                            <input type="hidden" name="currentShareToken" value={invoice.shareToken} />
                            <SubmitButton className="btn-secondary" pendingText="Enabling...">
                              Enable share link
                            </SubmitButton>
                          </form>
                        )}
                      </div>

                      <details className="mt-4">
                        <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
                          Edit invoice
                        </summary>
                        <form
                          action={updateInvoiceAction}
                          className="mt-4 space-y-4 rounded-[1.25rem] border border-white/8 bg-black/10 p-4"
                        >
                          <input type="hidden" name="projectId" value={project.id} />
                          <input type="hidden" name="id" value={invoice.id} />
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                              <p className="label">Invoice number</p>
                              <input className="field mt-2" name="invoiceNumber" defaultValue={invoice.number} required />
                            </div>
                            <div>
                              <p className="label">Title</p>
                              <input className="field mt-2" name="title" defaultValue={invoice.title} required />
                            </div>
                            <div>
                              <p className="label">Amount</p>
                              <input className="field mt-2" name="amount" defaultValue={invoice.amount} inputMode="decimal" min="0" />
                              <p className="field-hint">Used only if you leave line items empty.</p>
                            </div>
                            <div>
                              <p className="label">Status</p>
                              <select className="field-select mt-2" name="status" defaultValue={invoice.status}>
                                {invoiceStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <p className="label">Sent date</p>
                              <input className="field mt-2" name="sentDate" type="date" defaultValue={invoice.sentDate} />
                            </div>
                            <div>
                              <p className="label">Due date</p>
                              <input className="field mt-2" name="dueDate" type="date" defaultValue={invoice.dueDate} />
                            </div>
                            <div>
                              <p className="label">Paid date</p>
                              <input className="field mt-2" name="paidDate" type="date" defaultValue={invoice.paidDate} />
                            </div>
                            <div className="lg:col-span-2">
                              <p className="label">Notes</p>
                              <textarea className="field-area mt-2" name="notes" defaultValue={invoice.notes} />
                            </div>
                            <div className="lg:col-span-2">
                              <p className="label">Line items</p>
                              <div className="mt-3 space-y-3 rounded-[1rem] border border-white/8 bg-black/10 p-4">
                                {[...invoice.lineItems, ...Array.from({ length: 2 }, () => null)].map((item, index) => (
                                  <div
                                    key={`${invoice.id}-line-item-${index}`}
                                    className="grid gap-3 lg:grid-cols-[1.25fr_0.35fr_0.45fr]"
                                  >
                                    <input
                                      className="field"
                                      name="lineItemDescription"
                                      defaultValue={item?.description ?? ""}
                                      placeholder="Website design deposit"
                                    />
                                    <input
                                      className="field"
                                      name="lineItemQuantity"
                                      defaultValue={item?.quantity ?? ""}
                                      inputMode="decimal"
                                      min="0"
                                      placeholder="1"
                                    />
                                    <input
                                      className="field"
                                      name="lineItemUnitPrice"
                                      defaultValue={item?.unitPrice ?? ""}
                                      inputMode="decimal"
                                      min="0"
                                      placeholder="1900"
                                    />
                                  </div>
                                ))}
                              </div>
                              <p className="field-hint">These rows drive the invoice total and the document breakdown.</p>
                            </div>
                          </div>
                          <SubmitButton className="btn-secondary" pendingText="Saving invoice...">
                            Save invoice
                          </SubmitButton>
                          <ConfirmSubmitButton
                            className="mt-3 text-xs uppercase tracking-[0.18em] text-[rgba(255,228,214,0.9)] transition hover:text-[rgba(255,200,180,0.98)]"
                            confirmMessage="Delete this invoice?"
                            formAction={deleteInvoiceAction}
                            pendingText="Deleting..."
                          >
                            Delete invoice
                          </ConfirmSubmitButton>
                        </form>
                      </details>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          <section className="panel">
            <div>
              <p className="section-eyebrow">Ledger</p>
              <h2 className="section-title">Invoice and payment history</h2>
            </div>
            <div className="mt-6 space-y-4">
              <form action={createFinanceEntryAction} className="rounded-[1.4rem] border border-white/8 bg-[var(--color-panel-strong)]/58 p-5">
                <input type="hidden" name="projectId" value={project.id} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="label">Entry date</p>
                    <input className="field mt-2" name="entryDate" type="date" required />
                  </div>
                  <div>
                    <p className="label">Type</p>
                    <select className="field-select mt-2" name="kind" defaultValue="Invoice sent">
                      {financeEntryKinds.map((kind) => (
                        <option key={kind} value={kind}>
                          {kind}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="label">Linked invoice</p>
                    <select className="field-select mt-2" name="invoiceId" defaultValue="">
                      <option value="">No linked invoice</option>
                      {project.invoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.number} · {invoice.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="label">Amount</p>
                    <input className="field mt-2" inputMode="decimal" min="0" name="amount" placeholder="1900" />
                    <p className="field-hint">Leave `0` for note-only entries.</p>
                  </div>
                  <div>
                    <p className="label">Due date</p>
                    <input className="field mt-2" name="dueDate" type="date" />
                    <p className="field-hint">Optional, but invoices can be marked overdue from this.</p>
                  </div>
                  <div>
                    <p className="label">Note</p>
                    <input className="field mt-2" name="note" placeholder="Deposit received by bank transfer" />
                  </div>
                </div>
                <SubmitButton className="btn-secondary mt-4" pendingText="Adding entry...">
                  Add finance entry
                </SubmitButton>
              </form>

              {project.financeEntries.length === 0 ? (
                <div className="rounded-[1.4rem] border border-dashed border-white/10 px-5 py-6 text-sm text-slate-300/70">
                  No invoice or payment history has been logged for this project yet.
                </div>
              ) : (
                project.financeEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-[1.4rem] border border-white/8 bg-[var(--color-panel-strong)]/58 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                          {formatEntryDate(entry.date)}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-[var(--color-soft)]">
                          {entry.kind}
                        </h3>
                        {entry.invoiceId ? (
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-300/62">
                            Linked to{" "}
                            {project.invoices.find((invoice) => invoice.id === entry.invoiceId)?.number ??
                              "invoice"}
                          </p>
                        ) : null}
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-100/80">
                        {entry.amount > 0 ? formatCurrency(entry.amount) : "No amount"}
                      </span>
                    </div>

                    <div className="mt-4 rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="label">Due date</p>
                          <p className="mt-2 text-sm leading-6 text-slate-300/82">
                            {formatDueDate(entry.dueDate)}
                          </p>
                        </div>
                        <div>
                          <p className="label">Note</p>
                          <p className="mt-2 text-sm leading-6 text-slate-300/82">
                            {entry.note || "No note added."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <details className="mt-4">
                      <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
                        Edit finance entry
                      </summary>
                      <form
                        action={updateFinanceEntryAction}
                        className="mt-4 space-y-4 rounded-[1.25rem] border border-white/8 bg-black/10 p-4"
                      >
                        <input type="hidden" name="projectId" value={project.id} />
                        <input type="hidden" name="id" value={entry.id} />
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <p className="label">Entry date</p>
                            <input className="field mt-2" name="entryDate" type="date" defaultValue={entry.date} required />
                          </div>
                          <div>
                            <p className="label">Type</p>
                            <select className="field-select mt-2" name="kind" defaultValue={entry.kind}>
                              {financeEntryKinds.map((kind) => (
                                <option key={kind} value={kind}>
                                  {kind}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <p className="label">Linked invoice</p>
                            <select className="field-select mt-2" name="invoiceId" defaultValue={entry.invoiceId}>
                              <option value="">No linked invoice</option>
                              {project.invoices.map((invoice) => (
                                <option key={invoice.id} value={invoice.id}>
                                  {invoice.number} · {invoice.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <p className="label">Amount</p>
                            <input className="field mt-2" name="amount" defaultValue={entry.amount || ""} inputMode="decimal" min="0" />
                          </div>
                          <div>
                            <p className="label">Due date</p>
                            <input className="field mt-2" name="dueDate" type="date" defaultValue={entry.dueDate} />
                          </div>
                          <div>
                            <p className="label">Note</p>
                            <input className="field mt-2" name="note" defaultValue={entry.note} />
                          </div>
                        </div>
                        <SubmitButton className="btn-secondary" pendingText="Saving entry...">
                          Save finance entry
                        </SubmitButton>
                        <ConfirmSubmitButton
                          className="mt-3 text-xs uppercase tracking-[0.18em] text-[rgba(255,228,214,0.9)] transition hover:text-[rgba(255,200,180,0.98)]"
                          confirmMessage="Delete this finance entry?"
                          formAction={deleteFinanceEntryAction}
                          pendingText="Deleting..."
                        >
                          Delete finance entry
                        </ConfirmSubmitButton>
                      </form>
                    </details>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-eyebrow">Client</p>
                <h2 className="section-title">Who this project belongs to</h2>
              </div>
              {client ? (
                <Link className="text-link" href={`/clients/${client.id}`}>
                  Open client workspace
                </Link>
              ) : null}
            </div>
            <div className="mt-6 rounded-[1.4rem] border border-white/8 bg-[var(--color-panel-strong)]/58 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                {client?.company ?? "Client"}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[var(--color-soft)]">
                {client?.name ?? project.clientName}
              </h3>
              {client ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link className="btn-primary" href={`/clients/${client.id}`}>
                    View client workspace
                  </Link>
                  <Link
                    className="btn-secondary"
                    href={`/projects/new?clientId=${encodeURIComponent(client.id)}`}
                  >
                    New project for this client
                  </Link>
                </div>
              ) : null}
              <div className="mt-5 grid gap-4 text-sm text-slate-200/82">
                <div>
                  <p className="label">Email</p>
                  <p className="mt-2">{client?.email ?? "Not added yet"}</p>
                </div>
                <div>
                  <p className="label">Phone</p>
                  <p className="mt-2">{client?.phone ?? "Not added yet"}</p>
                </div>
                <div>
                  <p className="label">Notes</p>
                  <p className="mt-2 leading-7">
                    {client?.notes ?? "No client notes yet."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div>
              <p className="section-eyebrow">Credentials</p>
              <h2 className="section-title">Accounts tied to this build</h2>
            </div>
            <div className="mt-6 space-y-4">
              <form action={createCredentialAction} className="rounded-[1.4rem] border border-white/8 bg-[var(--color-panel-strong)]/58 p-5">
                <input type="hidden" name="projectId" value={project.id} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="label">Credential label</p>
                    <input className="field mt-2" name="label" placeholder="Hosting" minLength={2} required />
                  </div>
                  <div>
                    <p className="label">URL</p>
                    <input className="field mt-2" name="url" placeholder="example.com or service login" />
                    <p className="field-hint">Optional, but helpful when the login belongs to a specific service.</p>
                  </div>
                  <div>
                    <p className="label">Username</p>
                    <input className="field mt-2" name="username" />
                  </div>
                  <PasswordField label="Password" name="password" />
                </div>
                <div className="mt-4">
                  <p className="label">Notes</p>
                  <textarea className="field-area mt-2" name="notes" />
                </div>
                <SubmitButton className="btn-secondary mt-4" pendingText="Adding credential...">
                  Add credential
                </SubmitButton>
              </form>

              {project.credentials.length === 0 ? (
                <div className="rounded-[1.4rem] border border-dashed border-white/10 px-5 py-6 text-sm text-slate-300/70">
                  No credentials stored for this project yet.
                </div>
              ) : (
                project.credentials.map((credential) => (
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
                        <div className="field mt-2 break-all">{credential.url || "Not added yet"}</div>
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
                        Edit credential
                      </summary>
                      <form
                        action={updateCredentialAction}
                        className="mt-4 space-y-4 rounded-[1.25rem] border border-white/8 bg-black/10 p-4"
                      >
                        <input type="hidden" name="projectId" value={project.id} />
                        <input type="hidden" name="id" value={credential.id} />
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
                          <PasswordField
                            defaultValue={credential.password}
                            label="Password"
                            name="password"
                          />
                        </div>
                        <div>
                          <p className="label">Notes</p>
                          <textarea className="field-area mt-2" name="notes" defaultValue={credential.notes} />
                        </div>
                        <SubmitButton className="btn-secondary" pendingText="Saving credential...">
                          Save credential
                        </SubmitButton>
                        <ConfirmSubmitButton
                          className="mt-3 text-xs uppercase tracking-[0.18em] text-[rgba(255,228,214,0.9)] transition hover:text-[rgba(255,200,180,0.98)]"
                          confirmMessage="Delete this credential?"
                          formAction={deleteCredentialAction}
                          pendingText="Deleting..."
                        >
                          Delete credential
                        </ConfirmSubmitButton>
                      </form>
                    </details>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
