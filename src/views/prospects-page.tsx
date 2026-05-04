import Link from "next/link";
import {
  convertProposalToProjectAction,
  convertProspectToClientAction,
  createProposalAction,
  createProspectAction,
  deleteProposalAction,
  deleteProspectAction,
  updateProposalAction,
  updateProspectAction,
} from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FlashBanner } from "@/components/flash-banner";
import { SubmitButton } from "@/components/submit-button";
import { getProspects, paymentStructures, proposalStatuses } from "@/lib/crm-data";
import { getFeedbackFromSearchParams } from "@/lib/feedback";
import { normalizeExternalUrl } from "@/lib/url";

const prospectStatuses = [
  "New lead",
  "Reached out",
  "Call booked",
  "Proposal sent",
  "On hold",
] as const;

const proposalLineItemSlots = [0, 1, 2] as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getProspectStatusClasses(status: string) {
  switch (status) {
    case "Proposal sent":
      return "border-[rgba(81,135,169,0.28)] bg-[rgba(81,135,169,0.12)] text-[rgba(227,241,250,0.96)]";
    case "Call booked":
      return "border-[rgba(84,170,126,0.28)] bg-[rgba(84,170,126,0.14)] text-[rgba(225,255,236,0.96)]";
    case "Reached out":
      return "border-[rgba(224,150,63,0.34)] bg-[rgba(224,150,63,0.14)] text-[rgba(255,238,210,0.96)]";
    case "On hold":
      return "border-white/10 bg-white/6 text-slate-100/74";
    default:
      return "border-[rgba(136,190,219,0.24)] bg-[rgba(136,190,219,0.1)] text-[var(--color-soft)]";
  }
}

function getProposalStatusClasses(status: string) {
  switch (status) {
    case "Accepted":
      return "border-[rgba(84,170,126,0.28)] bg-[rgba(84,170,126,0.14)] text-[rgba(225,255,236,0.96)]";
    case "Sent":
      return "border-[rgba(81,135,169,0.28)] bg-[rgba(81,135,169,0.12)] text-[rgba(227,241,250,0.96)]";
    case "Declined":
      return "border-[rgba(210,98,58,0.38)] bg-[rgba(210,98,58,0.14)] text-[rgba(255,228,214,0.96)]";
    default:
      return "border-white/10 bg-white/6 text-slate-100/74";
  }
}

type ProspectsPageViewProps = {
  searchParams?: Promise<{
    message?: string;
    q?: string;
    sort?: string;
    type?: string;
  }>;
};

export default async function ProspectsPageView({
  searchParams,
}: ProspectsPageViewProps) {
  const params = await searchParams;
  const feedback = getFeedbackFromSearchParams(params);
  const prospects = await getProspects();
  const query = params?.q?.trim() ?? "";
  const sort = params?.sort?.trim() ?? "follow-up";
  const normalizedQuery = query.toLowerCase();

  const filteredProspects = normalizedQuery
    ? prospects.filter((prospect) =>
        [
          prospect.name,
          prospect.company,
          prospect.email,
          prospect.phone,
          prospect.source,
          prospect.status,
          prospect.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : prospects;

  const sortedProspects = [...filteredProspects].sort((left, right) => {
    switch (sort) {
      case "value-desc":
        return right.estimatedValue - left.estimatedValue;
      case "name-asc":
        return left.name.localeCompare(right.name);
      case "company-asc":
        return left.company.localeCompare(right.company);
      case "follow-up":
      default:
        return (left.nextFollowUp || "9999-12-31").localeCompare(
          right.nextFollowUp || "9999-12-31",
        );
    }
  });

  return (
    <div className="space-y-8">
      <FlashBanner message={feedback.message} type={feedback.type} />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-eyebrow">Potential clients</p>
          <h1 className="section-title">A home for outreach before they become real clients</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/76">
            Keep leads, referrals, and warm conversations here until they are ready to become client records and projects.
          </p>
        </div>
        <Link className="btn-secondary" href="/clients">
          Open clients
        </Link>
      </header>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="panel">
          <div>
            <p className="section-eyebrow">New prospect</p>
            <h2 className="section-title">Capture someone worth following up with</h2>
          </div>

          <form action={createProspectAction} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="label">Name</p>
                <input className="field mt-2" name="name" minLength={2} required />
              </div>
              <div>
                <p className="label">Company</p>
                <input className="field mt-2" name="company" minLength={2} required />
              </div>
              <div>
                <p className="label">Email</p>
                <input className="field mt-2" name="email" />
              </div>
              <div>
                <p className="label">Phone</p>
                <input className="field mt-2" name="phone" />
              </div>
              <div>
                <p className="label">Source</p>
                <input className="field mt-2" name="source" placeholder="Referral, Instagram, cold outreach..." />
              </div>
              <div>
                <p className="label">Status</p>
                <select className="field-select mt-2" name="status" defaultValue="New lead">
                  {prospectStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="label">Next follow-up</p>
                <input className="field mt-2" name="nextFollowUp" type="date" />
              </div>
              <div>
                <p className="label">Estimated value</p>
                <input className="field mt-2" name="estimatedValue" inputMode="decimal" placeholder="3200" />
              </div>
            </div>
            <div>
              <p className="label">Notes</p>
              <textarea className="field-area mt-2" name="notes" />
            </div>
            <SubmitButton className="btn-primary" pendingText="Adding prospect...">
              Add prospect
            </SubmitButton>
          </form>
        </section>

        <div className="space-y-6">
          <section className="panel">
            <form className="space-y-3" method="get">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_14rem_auto] xl:items-end">
                <div>
                  <p className="label">Search prospects</p>
                  <input
                    className="field mt-2"
                    defaultValue={query}
                    name="q"
                    placeholder="Search by name, company, source, notes, or status"
                  />
                </div>
                <div>
                  <p className="label">Sort</p>
                  <select className="field-select mt-2" defaultValue={sort} name="sort">
                    <option value="follow-up">Next follow-up</option>
                    <option value="value-desc">Highest potential value</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="company-asc">Company A-Z</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-3 xl:justify-end">
                  <button className="btn-secondary" type="submit">
                    Apply
                  </button>
                  {query || sort !== "follow-up" ? (
                    <Link className="btn-secondary" href="/prospects">
                      Clear
                    </Link>
                  ) : null}
                </div>
              </div>
            </form>
          </section>

          <section className="space-y-4">
            {sortedProspects.length === 0 ? (
              <div className="panel">
                <p className="section-eyebrow">No matches</p>
                <h2 className="section-title">No prospects matched that search</h2>
                <p className="mt-4 text-sm leading-7 text-slate-300/76">
                  Try a different name, company, or source, or clear the search to bring the full list back.
                </p>
              </div>
            ) : (
              sortedProspects.map((prospect) => (
                (() => {
                  const sourceUrl = normalizeExternalUrl(prospect.source);

                  return (
                <article key={prospect.id} className="panel">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                        {prospect.company}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-[var(--color-soft)]">
                        {prospect.name}
                      </h2>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${getProspectStatusClasses(
                        prospect.status,
                      )}`}
                    >
                      {prospect.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="label">Email</p>
                      <p className="mt-2 text-sm text-slate-100/90">{prospect.email || "Not added"}</p>
                    </div>
                    <div>
                      <p className="label">Phone</p>
                      <p className="mt-2 text-sm text-slate-100/90">{prospect.phone || "Not added"}</p>
                    </div>
                    <div>
                      <p className="label">Source</p>
                      {sourceUrl ? (
                        <a
                          className="mt-2 inline-flex text-sm text-[var(--color-soft)] underline decoration-white/15 underline-offset-4 transition hover:text-[var(--color-accent)]"
                          href={sourceUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {prospect.source}
                        </a>
                      ) : (
                        <p className="mt-2 text-sm text-slate-100/90">{prospect.source || "Not added"}</p>
                      )}
                    </div>
                    <div>
                      <p className="label">Potential value</p>
                      <p className="mt-2 text-sm text-slate-100/90">
                        {prospect.estimatedValue > 0 ? formatCurrency(prospect.estimatedValue) : "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-[var(--color-panel-strong)]/55 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="label">Next follow-up</p>
                        <p className="mt-2 text-sm text-slate-100/90">
                          {prospect.nextFollowUp || "No date set yet"}
                        </p>
                      </div>
                      <form action={convertProspectToClientAction}>
                        <input type="hidden" name="id" value={prospect.id} />
                        <input type="hidden" name="name" value={prospect.name} />
                        <input type="hidden" name="company" value={prospect.company} />
                        <input type="hidden" name="email" value={prospect.email} />
                        <input type="hidden" name="phone" value={prospect.phone} />
                        <input type="hidden" name="notes" value={prospect.notes} />
                        <SubmitButton className="btn-primary" pendingText="Converting...">
                          Convert to client
                        </SubmitButton>
                      </form>
                    </div>
                  </div>

                  <section className="mt-5 rounded-[1.25rem] border border-white/8 bg-[var(--color-panel-strong)]/55 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="section-eyebrow">Proposals</p>
                        <h3 className="section-title">Structured offers for this lead</h3>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-100/80">
                        {prospect.proposals.length} proposal{prospect.proposals.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="mt-5 space-y-4">
                      {prospect.proposals.length === 0 ? (
                        <div className="rounded-[1rem] border border-dashed border-white/10 px-4 py-5 text-sm text-slate-300/68">
                          No structured proposal yet. Build one here when the lead is ready for scope and pricing.
                        </div>
                      ) : (
                        prospect.proposals.map((proposal) => (
                          <article
                            key={proposal.id}
                            className="rounded-[1.15rem] border border-white/8 bg-[rgba(8,19,27,0.48)] p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                                  {proposal.number}
                                </p>
                                <h4 className="mt-2 text-xl font-semibold text-[var(--color-soft)]">
                                  {proposal.title}
                                </h4>
                              </div>
                              <span
                                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${getProposalStatusClasses(
                                  proposal.status,
                                )}`}
                              >
                                {proposal.status}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <div>
                                <p className="label">Amount</p>
                                <p className="mt-2 text-sm text-slate-100/90">
                                  {formatCurrency(proposal.amount)}
                                </p>
                              </div>
                              <div>
                                <p className="label">Valid until</p>
                                <p className="mt-2 text-sm text-slate-100/90">
                                  {proposal.validUntil || "Not set"}
                                </p>
                              </div>
                              <div>
                                <p className="label">Payment plan</p>
                                <p className="mt-2 text-sm text-slate-100/90">
                                  {proposal.paymentStructure === "Installments"
                                    ? `${proposal.installmentCount || 1} installments`
                                    : proposal.paymentStructure}
                                </p>
                              </div>
                              <div>
                                <p className="label">Hosting</p>
                                <p className="mt-2 text-sm text-slate-100/90">
                                  {proposal.hostingEnabled
                                    ? `${formatCurrency(proposal.hostingAmount)}/mo`
                                    : "Not included"}
                                </p>
                              </div>
                            </div>

                            {proposal.lineItems.length > 0 ? (
                              <div className="mt-4 rounded-[1rem] border border-white/8 bg-black/10 p-4">
                                <p className="label">Scope</p>
                                <div className="mt-3 space-y-3">
                                  {proposal.lineItems.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-start justify-between gap-4 text-sm text-slate-100/88"
                                    >
                                      <div>
                                        <p>{item.description}</p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-300/58">
                                          {item.quantity} x {formatCurrency(item.unitPrice)}
                                        </p>
                                      </div>
                                      <span>{formatCurrency(item.amount)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {proposal.notes ? (
                              <p className="mt-4 text-sm leading-6 text-slate-300/76">
                                {proposal.notes}
                              </p>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-3">
                              {proposal.status === "Accepted" ? (
                                <form action={convertProposalToProjectAction}>
                                  <input type="hidden" name="proposalId" value={proposal.id} />
                                  <input type="hidden" name="prospectId" value={prospect.id} />
                                  <input type="hidden" name="name" value={prospect.name} />
                                  <input type="hidden" name="company" value={prospect.company} />
                                  <input type="hidden" name="email" value={prospect.email} />
                                  <input type="hidden" name="phone" value={prospect.phone} />
                                  <input type="hidden" name="clientNotes" value={prospect.notes} />
                                  <input type="hidden" name="projectName" value={proposal.projectName || proposal.title} />
                                  <input type="hidden" name="contractAmount" value={String(proposal.amount)} />
                                  <input type="hidden" name="paymentStructure" value={proposal.paymentStructure} />
                                  <input type="hidden" name="installmentCount" value={String(proposal.installmentCount)} />
                                  <input type="hidden" name="hostingAmount" value={String(proposal.hostingAmount)} />
                                  <input type="hidden" name="overview" value={proposal.overview} />
                                  <input type="hidden" name="acceptedDate" value={proposal.acceptedDate} />
                                  <input type="hidden" name="followUpDate" value={prospect.nextFollowUp} />
                                  {proposal.hostingEnabled ? (
                                    <input type="hidden" name="hostingEnabled" value="on" />
                                  ) : null}
                                  <SubmitButton className="btn-primary" pendingText="Creating project...">
                                    Convert accepted proposal to project
                                  </SubmitButton>
                                </form>
                              ) : null}
                            </div>

                            <details className="mt-4">
                              <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
                                Edit proposal
                              </summary>
                              <form
                                action={updateProposalAction}
                                className="mt-4 space-y-4 rounded-[1rem] border border-white/8 bg-black/10 p-4"
                              >
                                <input type="hidden" name="id" value={proposal.id} />
                                <input type="hidden" name="prospectId" value={prospect.id} />
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div>
                                    <p className="label">Proposal number</p>
                                    <input className="field mt-2" name="proposalNumber" defaultValue={proposal.number} required />
                                  </div>
                                  <div>
                                    <p className="label">Project name</p>
                                    <input className="field mt-2" name="projectName" defaultValue={proposal.projectName} />
                                  </div>
                                  <div>
                                    <p className="label">Title</p>
                                    <input className="field mt-2" name="title" defaultValue={proposal.title} required />
                                  </div>
                                  <div>
                                    <p className="label">Status</p>
                                    <select className="field-select mt-2" name="status" defaultValue={proposal.status}>
                                      {proposalStatuses.map((status) => (
                                        <option key={status} value={status}>
                                          {status}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <p className="label">Sent date</p>
                                    <input className="field mt-2" name="sentDate" type="date" defaultValue={proposal.sentDate} />
                                  </div>
                                  <div>
                                    <p className="label">Valid until</p>
                                    <input className="field mt-2" name="validUntil" type="date" defaultValue={proposal.validUntil} />
                                  </div>
                                  <div>
                                    <p className="label">Accepted date</p>
                                    <input className="field mt-2" name="acceptedDate" type="date" defaultValue={proposal.acceptedDate} />
                                  </div>
                                  <div>
                                    <p className="label">Amount fallback</p>
                                    <input className="field mt-2" name="amount" defaultValue={proposal.amount} inputMode="decimal" />
                                  </div>
                                  <div>
                                    <p className="label">Payment structure</p>
                                    <select className="field-select mt-2" name="paymentStructure" defaultValue={proposal.paymentStructure}>
                                      {paymentStructures.map((structure) => (
                                        <option key={structure} value={structure}>
                                          {structure}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <p className="label">Installment count</p>
                                    <input className="field mt-2" name="installmentCount" defaultValue={proposal.installmentCount || ""} inputMode="numeric" />
                                  </div>
                                  <div>
                                    <p className="label">Hosting amount</p>
                                    <input className="field mt-2" name="hostingAmount" defaultValue={proposal.hostingAmount || ""} inputMode="decimal" />
                                  </div>
                                  <label className="flex items-center gap-3 rounded-[1rem] border border-white/8 bg-[var(--color-panel-strong)]/45 px-4 py-3 text-sm text-slate-100/90">
                                    <input defaultChecked={proposal.hostingEnabled} name="hostingEnabled" type="checkbox" />
                                    Include hosting
                                  </label>
                                </div>
                                <div>
                                  <p className="label">Overview</p>
                                  <textarea className="field-area mt-2" name="overview" defaultValue={proposal.overview} />
                                </div>
                                <div>
                                  <p className="label">Notes</p>
                                  <textarea className="field-area mt-2" name="notes" defaultValue={proposal.notes} />
                                </div>
                                <div className="grid gap-3">
                                  <p className="label">Line items</p>
                                  {[0, 1, 2].map((index) => {
                                    const item = proposal.lineItems[index];

                                    return (
                                      <div key={`${proposal.id}-item-${index}`} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]">
                                        <input
                                          className="field"
                                          name="proposalLineItemDescription"
                                          defaultValue={item?.description ?? ""}
                                          placeholder="Homepage, strategy, launch support..."
                                        />
                                        <input
                                          className="field"
                                          name="proposalLineItemQuantity"
                                          defaultValue={item?.quantity ?? ""}
                                          inputMode="decimal"
                                          placeholder="1"
                                        />
                                        <input
                                          className="field"
                                          name="proposalLineItemUnitPrice"
                                          defaultValue={item?.unitPrice ?? ""}
                                          inputMode="decimal"
                                          placeholder="1200"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                                <SubmitButton className="btn-secondary" pendingText="Updating proposal...">
                                  Update proposal
                                </SubmitButton>
                              </form>
                              <form action={deleteProposalAction} className="mt-4">
                                <input type="hidden" name="id" value={proposal.id} />
                                <ConfirmSubmitButton
                                  className="text-xs uppercase tracking-[0.18em] text-[rgba(255,228,214,0.9)] transition hover:text-[rgba(255,200,180,0.98)]"
                                  confirmMessage="Delete this proposal?"
                                  pendingText="Deleting..."
                                >
                                  Delete proposal
                                </ConfirmSubmitButton>
                              </form>
                            </details>
                          </article>
                        ))
                      )}
                    </div>

                    <details className="mt-5">
                      <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
                        Create proposal
                      </summary>
                      <form action={createProposalAction} className="mt-4 space-y-4 rounded-[1rem] border border-white/8 bg-black/10 p-4">
                        <input type="hidden" name="prospectId" value={prospect.id} />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="label">Proposal number</p>
                            <input className="field mt-2" name="proposalNumber" defaultValue={`PROP-${prospect.id.slice(-4).toUpperCase()}`} required />
                          </div>
                          <div>
                            <p className="label">Project name</p>
                            <input className="field mt-2" name="projectName" placeholder={`${prospect.company} Website`} />
                          </div>
                          <div>
                            <p className="label">Title</p>
                            <input className="field mt-2" name="title" placeholder={`${prospect.company} proposal`} required />
                          </div>
                          <div>
                            <p className="label">Status</p>
                            <select className="field-select mt-2" name="status" defaultValue="Draft">
                              {proposalStatuses.map((status) => (
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
                            <p className="label">Valid until</p>
                            <input className="field mt-2" name="validUntil" type="date" />
                          </div>
                          <div>
                            <p className="label">Accepted date</p>
                            <input className="field mt-2" name="acceptedDate" type="date" />
                          </div>
                          <div>
                            <p className="label">Amount fallback</p>
                            <input className="field mt-2" name="amount" defaultValue={prospect.estimatedValue || ""} inputMode="decimal" />
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
                            <input className="field mt-2" name="installmentCount" inputMode="numeric" placeholder="3" />
                          </div>
                          <div>
                            <p className="label">Hosting amount</p>
                            <input className="field mt-2" name="hostingAmount" inputMode="decimal" placeholder="39" />
                          </div>
                          <label className="flex items-center gap-3 rounded-[1rem] border border-white/8 bg-[var(--color-panel-strong)]/45 px-4 py-3 text-sm text-slate-100/90">
                            <input name="hostingEnabled" type="checkbox" />
                            Include hosting
                          </label>
                        </div>
                        <div>
                          <p className="label">Overview</p>
                          <textarea className="field-area mt-2" name="overview" defaultValue={prospect.notes} />
                        </div>
                        <div>
                          <p className="label">Notes</p>
                          <textarea className="field-area mt-2" name="notes" />
                        </div>
                        <div className="grid gap-3">
                          <p className="label">Line items</p>
                          {proposalLineItemSlots.map((index) => (
                            <div key={`${prospect.id}-new-item-${index}`} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]">
                              <input
                                className="field"
                                name="proposalLineItemDescription"
                                placeholder="Homepage, service pages, launch support..."
                              />
                              <input
                                className="field"
                                name="proposalLineItemQuantity"
                                inputMode="decimal"
                                placeholder="1"
                              />
                              <input
                                className="field"
                                name="proposalLineItemUnitPrice"
                                inputMode="decimal"
                                placeholder="1200"
                              />
                            </div>
                          ))}
                        </div>
                        <SubmitButton className="btn-primary" pendingText="Creating proposal...">
                          Create proposal
                        </SubmitButton>
                      </form>
                    </details>
                  </section>

                  <div className="mt-5">
                    <p className="label">Notes</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300/78">
                      {prospect.notes || "No notes yet."}
                    </p>
                  </div>

                  <details className="mt-6">
                    <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
                      Edit prospect
                    </summary>
                    <form action={updateProspectAction} className="mt-4 space-y-4 rounded-[1.25rem] border border-white/8 bg-[var(--color-panel-strong)]/55 p-4">
                      <input name="id" type="hidden" value={prospect.id} />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="label">Name</p>
                          <input className="field mt-2" name="name" defaultValue={prospect.name} minLength={2} required />
                        </div>
                        <div>
                          <p className="label">Company</p>
                          <input className="field mt-2" name="company" defaultValue={prospect.company} minLength={2} required />
                        </div>
                        <div>
                          <p className="label">Email</p>
                          <input className="field mt-2" name="email" defaultValue={prospect.email} />
                        </div>
                        <div>
                          <p className="label">Phone</p>
                          <input className="field mt-2" name="phone" defaultValue={prospect.phone} />
                        </div>
                        <div>
                          <p className="label">Source</p>
                          <input className="field mt-2" name="source" defaultValue={prospect.source} />
                        </div>
                        <div>
                          <p className="label">Status</p>
                          <select className="field-select mt-2" name="status" defaultValue={prospect.status}>
                            {prospectStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <p className="label">Next follow-up</p>
                          <input className="field mt-2" name="nextFollowUp" type="date" defaultValue={prospect.nextFollowUp} />
                        </div>
                        <div>
                          <p className="label">Estimated value</p>
                          <input className="field mt-2" name="estimatedValue" inputMode="decimal" defaultValue={prospect.estimatedValue || ""} />
                        </div>
                      </div>
                      <div>
                        <p className="label">Notes</p>
                        <textarea className="field-area mt-2" name="notes" defaultValue={prospect.notes} />
                      </div>
                      <SubmitButton className="btn-secondary" pendingText="Updating prospect...">
                        Update prospect
                      </SubmitButton>
                    </form>
                    <form action={deleteProspectAction} className="mt-4">
                      <input type="hidden" name="id" value={prospect.id} />
                      <ConfirmSubmitButton
                        className="text-xs uppercase tracking-[0.18em] text-[rgba(255,228,214,0.9)] transition hover:text-[rgba(255,200,180,0.98)]"
                        confirmMessage="Delete this prospect?"
                        pendingText="Deleting..."
                      >
                        Delete prospect
                      </ConfirmSubmitButton>
                    </form>
                  </details>
                </article>
                  );
                })()
              ))
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
