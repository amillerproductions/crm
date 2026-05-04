import Image from "next/image";
import Link from "next/link";
import { PrintPageButton } from "@/components/print-page-button";
import { SavePdfButton } from "@/components/save-pdf-button";
import type { Client, Project, ProjectInvoice } from "@/lib/mock-data";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function getInvoiceTone(status: ProjectInvoice["status"]) {
  if (status === "Paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Overdue") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "Sent") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

export function InvoiceDocumentPage({
  client,
  invoice,
  isPublic = false,
  issuedBy,
  project,
}: {
  client?: Client;
  invoice: ProjectInvoice;
  isPublic?: boolean;
  issuedBy: string;
  project: Project;
}) {
  const remainingAmount = Math.max(invoice.amount - invoice.linkedPaymentsTotal, 0);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#eef4f8,_#f8fafc)] px-4 py-4 text-slate-900 sm:px-6 sm:py-6 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto w-full max-w-6xl print:max-w-none">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          {isPublic ? (
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Secure shared invoice view
            </div>
          ) : (
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-900"
            >
              Back to project
            </Link>
          )}
          <div className="flex flex-wrap gap-3">
            {!isPublic ? (
              <Link
                href={`/projects/${project.id}`}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
              >
                Open project
              </Link>
            ) : null}
            <SavePdfButton className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50" />
            <PrintPageButton className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[var(--color-accent-strong)]" />
          </div>
        </div>

        <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_35px_90px_rgba(15,23,42,0.12)] print:rounded-none print:border-0 print:shadow-none">
          <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(81,135,169,0.18),_transparent_34%),linear-gradient(135deg,_rgba(244,250,254,1),_rgba(255,255,255,1))] px-6 py-8 sm:px-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                    <Image
                      src="/kage-mark.png"
                      alt="KAGE Media"
                      width={42}
                      height={42}
                      className="h-10 w-10 object-contain"
                      preload={true}
                    />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                      KAGE Media
                    </p>
                    <h1 className="mt-2 font-display text-5xl leading-none text-slate-900">
                      Invoice
                    </h1>
                  </div>
                </div>

                <p className="mt-6 max-w-lg text-sm leading-7 text-slate-600">
                  A clean branded invoice document generated from the CRM so the
                  project, payment, and due-date details stay aligned with your
                  internal records.
                </p>
              </div>

              <div className="grid gap-3 sm:min-w-[22rem] sm:grid-cols-2">
                <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                    Invoice number
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {invoice.number}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                    Status
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getInvoiceTone(invoice.status)}`}
                  >
                    {invoice.status}
                  </span>
                </div>
                <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                    Sent date
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {formatDate(invoice.sentDate)}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                    Due date
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-8 sm:px-10 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="space-y-6">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                  From
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                  KAGE Media
                </h2>
                <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                  <p>Issued by {issuedBy}</p>
                  <p>Custom web design and launch support</p>
                  <p>Generated inside your CRM</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                  Bill to
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                  {client?.company ?? project.clientName}
                </h2>
                <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                  <p>{client?.name ?? project.clientName}</p>
                  <p>{client?.email || "No email on file"}</p>
                  <p>{client?.phone || "No phone on file"}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                  Project
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                  {project.name}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                      Payment structure
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {project.paymentStructure}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                      Current progress
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {project.paymentStatus}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="overflow-hidden rounded-[1.6rem] border border-slate-200">
                <div className="grid grid-cols-[1.2fr_0.5fr_0.6fr] gap-4 border-b border-slate-200 bg-slate-100 px-5 py-4 text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                  <p>Description</p>
                  <p>Qty</p>
                  <p>Amount</p>
                </div>
                <div className="divide-y divide-slate-200">
                  {(invoice.lineItems.length > 0
                    ? invoice.lineItems
                    : [
                        {
                          id: `${invoice.id}-fallback`,
                          description: invoice.title,
                          quantity: 1,
                          unitPrice: invoice.amount,
                          amount: invoice.amount,
                        },
                      ]).map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1.2fr_0.5fr_0.6fr] gap-4 px-5 py-5 text-sm text-slate-700"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{item.description}</p>
                        <p className="mt-2 leading-6 text-slate-600">
                          Billing line item for {project.name}.
                        </p>
                      </div>
                      <p>{item.quantity}</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 px-5 py-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
                    <span>Invoice total</span>
                    <span>{formatCurrency(invoice.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
                    <span>Payments applied</span>
                    <span>{formatCurrency(invoice.linkedPaymentsTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
                    <span>Balance due</span>
                    <span>{formatCurrency(remainingAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200 bg-white px-5 py-5">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                  Notes
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {invoice.notes ||
                    "Thank you for working with KAGE Media. Payment terms and milestones should match the project agreement tracked in the CRM."}
                </p>
              </div>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
