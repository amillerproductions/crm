import Link from "next/link";
import { createProjectAction } from "@/app/actions";
import { FlashBanner } from "@/components/flash-banner";
import { SubmitButton } from "@/components/submit-button";
import { getClients, paymentStructures, stages } from "@/lib/crm-data";
import { getFeedbackFromSearchParams } from "@/lib/feedback";

const initialPageRows = Array.from({ length: 4 });

type NewProjectPageProps = {
  searchParams?: Promise<{
    clientId?: string;
    message?: string;
    type?: string;
  }>;
};

export default async function NewProjectPageView({
  searchParams,
}: NewProjectPageProps) {
  const params = await searchParams;
  const feedback = getFeedbackFromSearchParams(params);
  const clients = await getClients();
  const selectedClientId = params?.clientId ?? "";
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const backHref = selectedClient ? `/clients/${selectedClient.id}` : "/projects";

  return (
    <div className="space-y-8">
      <FlashBanner message={feedback.message} type={feedback.type} />

      <header className="space-y-5">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--color-accent)] transition hover:text-[var(--color-soft)]"
        >
          <span>{selectedClient ? "Back to client" : "Back to projects"}</span>
        </Link>

        <div className="rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,_rgba(81,135,169,0.22),_transparent_36%),linear-gradient(160deg,_rgba(24,54,72,0.94),_rgba(13,21,29,0.98))] p-6 shadow-[0_24px_60px_rgba(1,8,13,0.34)]">
          <p className="section-eyebrow">New project</p>
          <h1 className="mt-3 font-display text-5xl leading-none text-[var(--color-soft)]">
            {selectedClient
              ? `Create a project for ${selectedClient.company}.`
              : "Create a new project workspace."}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300/78">
            {selectedClient
              ? "The client is already connected here, so you can focus on the stage, URLs, contract value, and kickoff notes."
              : "Set up the client connection, current stage, URLs, and initial notes in one place so the build can start with a cleaner handoff."}
          </p>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="panel">
          <div>
            <p className="section-eyebrow">Project details</p>
            <h2 className="section-title">Create the workspace</h2>
          </div>

          <form action={createProjectAction} className="mt-6 space-y-4">
            <input name="redirectTo" type="hidden" value="/projects" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <p className="label">Project name</p>
                <input className="field mt-2" name="name" minLength={2} required />
                <p className="field-hint">Use the client-facing name you want to recognize quickly.</p>
              </div>
              <div>
                <p className="label">Client</p>
                <select className="field-select mt-2" name="clientId" required defaultValue={selectedClientId}>
                  <option value="" disabled>
                    Select client
                  </option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.company}
                    </option>
                  ))}
                </select>
                <p className="field-hint">Projects always stay tied to one client record.</p>
              </div>
              <div>
                <p className="label">Stage</p>
                <select className="field-select mt-2" name="stage" defaultValue="Lead Found">
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="label">Homepage status</p>
                <input className="field mt-2" name="homepageStatus" defaultValue="Not started" />
              </div>
              <div>
                <p className="label">Priority</p>
                <select className="field-select mt-2" name="attentionPriority" defaultValue="Normal">
                  {["Low", "Normal", "High", "Urgent"].map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="label">Waiting on</p>
                <input className="field mt-2" name="waitingOn" placeholder="Client reply, assets, invoice, none" />
              </div>
              <div>
                <p className="label">Follow-up date</p>
                <input className="field mt-2" name="followUpDate" type="date" />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/8 bg-[var(--color-panel-strong)]/52 p-5">
              <div>
                <p className="section-eyebrow">Finance</p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--color-soft)]">
                  Payment setup and hosting
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/76">
                  Capture the total project value, how the client is paying, and
                  whether hosting is a separate recurring charge.
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <p className="label">Contract amount</p>
                  <input
                    className="field mt-2"
                    inputMode="decimal"
                    min="0"
                    name="contractAmount"
                    placeholder="3800"
                  />
                  <p className="field-hint">Numbers only, with optional cents.</p>
                </div>
                <div>
                  <p className="label">Payment structure</p>
                  <select className="field-select mt-2" name="paymentStructure" defaultValue="Paid in full">
                    {paymentStructures.map((structure) => (
                      <option key={structure} value={structure}>
                        {structure}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="label">Installment count</p>
                  <input
                    className="field mt-2"
                    defaultValue="0"
                    inputMode="numeric"
                    min="0"
                    name="installmentCount"
                  />
                  <p className="field-hint">Only used when the structure is installments.</p>
                </div>
                <div className="rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
                  <p className="label">Payment progress</p>
                  <p className="mt-2 text-sm leading-6 text-slate-100/90">
                    This is now driven by invoice and payment entries in the ledger after the project is created.
                  </p>
                </div>
                <label className="block">
                  <p className="label">Hosting</p>
                  <span className="mt-2 flex min-h-[3.5rem] cursor-pointer items-center justify-between gap-4 rounded-[1rem] border border-white/16 bg-[linear-gradient(180deg,_rgb(8_19_27_/_0.56),_rgb(10_23_32_/_0.72))] px-4 py-3 text-sm text-slate-100/90 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)] transition hover:border-white/22">
                    <span>Charge separately for hosting</span>
                    <input className="h-4 w-4 shrink-0 accent-[var(--color-accent)]" name="hostingEnabled" type="checkbox" />
                  </span>
                </label>
                <div>
                  <p className="label">Hosting charge</p>
                  <input
                    className="field mt-2"
                    inputMode="decimal"
                    min="0"
                    name="hostingAmount"
                    placeholder="49"
                  />
                  <p className="field-hint">Use the recurring amount you charge, usually monthly.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="label">Working URL</p>
                <input className="field mt-2" name="workingUrl" placeholder="preview.example.com or Not started" />
                <p className="field-hint">Optional. Use a full URL, a staging label, or leave it blank.</p>
              </div>
              <div>
                <p className="label">Live URL</p>
                <input className="field mt-2" name="liveUrl" placeholder="example.com" />
                <p className="field-hint">Optional until the project is live.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="label">Overview</p>
                <textarea className="field-area mt-2" name="overview" />
                <p className="field-hint">Summarize the goal, offer, and overall project direction.</p>
              </div>
              <div>
                <p className="label">Homepage notes</p>
                <textarea className="field-area mt-2" name="homepageNotes" />
                <p className="field-hint">Capture what matters most for the first build phase.</p>
              </div>
            </div>
            <div>
              <p className="label">Next action</p>
              <textarea className="field-area mt-2" name="nextAction" />
              <p className="field-hint">Write the next concrete move you want to take on this project.</p>
            </div>

            <div className="rounded-[1.5rem] border border-white/8 bg-[var(--color-panel-strong)]/52 p-5">
              <div>
                <p className="section-eyebrow">Pages</p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--color-soft)]">
                  Add the core pages up front
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/76">
                  Start the project with the main pages already mapped out. Leave any row blank if you do not need it yet.
                </p>
              </div>

              <div className="mt-5 space-y-4">
                {initialPageRows.map((_, index) => (
                  <div
                    key={`new-project-page-row-${index}`}
                    className="rounded-[1.25rem] border border-white/8 bg-black/10 p-4"
                  >
                    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.42fr]">
                      <div>
                        <p className="label">Page title</p>
                        <input
                          className="field mt-2"
                          name="pageTitle"
                          placeholder={
                            index === 0
                              ? "Home"
                              : index === 1
                                ? "Services"
                                : index === 2
                                  ? "About"
                                  : "Contact"
                          }
                        />
                      </div>
                      <div>
                        <p className="label">Status</p>
                        <select className="field-select mt-2" name="pageStatus" defaultValue="Not started">
                          {["Not started", "In progress", "Complete"].map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div>
                        <p className="label">Notes</p>
                        <textarea
                          className="field-area mt-2"
                          name="pageNotes"
                          placeholder="What belongs on this page?"
                        />
                      </div>
                      <div>
                        <p className="label">Issues</p>
                        <textarea
                          className="field-area mt-2"
                          name="pageIssues"
                          placeholder="Open questions, blockers, or approvals"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <SubmitButton className="btn-primary" pendingText="Creating project...">
                Create project
              </SubmitButton>
              <Link className="btn-secondary" href={backHref}>
                Cancel
              </Link>
            </div>
          </form>
        </section>

        <section className="panel">
          <div>
            <p className="section-eyebrow">Why this page</p>
            <h2 className="section-title">A cleaner project intake flow</h2>
          </div>

          <div className="mt-6 grid gap-4">
            {[
              "The board stays focused on active work instead of doubling as a form surface.",
              "You get room for URLs, money, and notes without squeezing the project view.",
              selectedClient
                ? `This one is already tied to ${selectedClient.company}, so you can move faster.`
                : "It opens the door for richer intake later, like templates or client-prefilled projects.",
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
