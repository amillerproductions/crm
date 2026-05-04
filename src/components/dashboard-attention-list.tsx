"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getPaymentMilestoneCount } from "@/lib/mock-data";
import type { Project } from "@/lib/mock-data";

function formatUpdatedLabel(updatedAt: string, currentTimestamp: number) {
  const days = Math.max(
    0,
    Math.floor((currentTimestamp - new Date(updatedAt).getTime()) / 86400000),
  );

  return `${days}d ago`;
}

function daysUntil(dateValue: string, currentTimestamp: number) {
  if (!dateValue) {
    return null;
  }

  const target = new Date(`${dateValue}T12:00:00`).getTime();
  return Math.floor((target - currentTimestamp) / 86400000);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DashboardAttentionList({
  projects,
}: {
  projects: Project[];
}) {
  const [currentTimestamp] = useState(() => Date.now());

  const attentionProjects = useMemo(() => {
    return projects
      .map((project) => {
        const reasons: string[] = [];
        let score = 0;
        const daysSinceUpdate = Math.max(
          0,
          Math.floor(
            (currentTimestamp - new Date(project.updatedAt).getTime()) /
              86400000,
          ),
        );
        const daysUntilFollowUp = daysUntil(project.followUpDate, currentTimestamp);

        if (project.attentionPriority === "Urgent") {
          score += 7;
          reasons.push("Marked urgent");
        } else if (project.attentionPriority === "High") {
          score += 4;
          reasons.push("Marked high priority");
        } else if (project.attentionPriority === "Low") {
          score -= 1;
        }

        if (daysUntilFollowUp !== null) {
          if (daysUntilFollowUp < 0) {
            score += 5;
            reasons.push("Follow-up date is overdue");
          } else if (daysUntilFollowUp <= 1) {
            score += 3;
            reasons.push("Follow-up is due soon");
          }
        }

        if (project.stage === "Payment Requested") {
          score += 7;
          reasons.push("Invoice still needs follow-up");
        }

        if (
          project.stage === "Launch Ready" &&
          project.paymentsReceivedCount <
            getPaymentMilestoneCount(
              project.paymentStructure,
              project.installmentCount,
            )
        ) {
          score += 5;
          reasons.push("Launch-ready with money still open");
        }

        if (project.homepageStatus.toLowerCase().includes("waiting")) {
          score += 4;
          reasons.push("Waiting on client input");
        }

        if (project.waitingOn) {
          score += 2;
        }

        if (daysSinceUpdate >= 10) {
          score += 4;
          reasons.push(`No project updates for ${daysSinceUpdate} days`);
        } else if (daysSinceUpdate >= 6) {
          score += 2;
          reasons.push(`Quiet for ${daysSinceUpdate} days`);
        }

        if (
          project.stage === "Site Build" &&
          project.completedPages <= 1 &&
          project.totalPages >= 4
        ) {
          score += 4;
          reasons.push("Build looks early for its scope");
        }

        if (
          project.stage === "Outreach / Offer Sent" &&
          project.paymentsReceivedCount === 0
        ) {
          score += 3;
          reasons.push("Offer is out and still needs a reply");
        }

        if (
          project.stage === "Launch Ready" &&
          project.completedPages < project.totalPages
        ) {
          score += 2;
          reasons.push("Still has incomplete pages before launch");
        }

        if (
          project.paymentsReceivedCount <
            getPaymentMilestoneCount(
              project.paymentStructure,
              project.installmentCount,
            )
        ) {
          score += 1;
        }

        return {
          project,
          score,
          primaryReason: reasons[0] ?? "Worth checking today",
          secondaryReason:
            project.nextAction ||
            reasons[1] ||
            `${project.completedPages}/${project.totalPages} pages complete`,
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, 4);
  }, [currentTimestamp, projects]);

  return (
    <div className="mt-6 space-y-4">
      {attentionProjects.map(
        ({ project, primaryReason, score, secondaryReason }) => (
          <article
            key={project.id}
            className="rounded-[1.5rem] border border-white/8 bg-[var(--color-panel-strong)]/65 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                  {project.clientName}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--color-soft)]">
                  {project.name}
                </h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-100/80">
                {project.stage}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-[rgba(210,98,58,0.38)] bg-[rgba(210,98,58,0.14)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[rgba(255,228,214,0.96)]">
                {primaryReason}
              </span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-100/72">
                Priority {score}
              </span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-100/72">
                Updated {formatUpdatedLabel(project.updatedAt, currentTimestamp)}
              </span>
            </div>
            <div className="mt-5 grid gap-4 text-sm text-slate-300/82 sm:grid-cols-3">
              <div>
                <p className="label">Homepage</p>
                <p className="mt-2 text-slate-100/90">{project.homepageStatus}</p>
              </div>
              <div>
                <p className="label">Contract</p>
                <p className="mt-2 text-slate-100/90">{project.contract}</p>
              </div>
              <div>
                <p className="label">Billing</p>
                <p className="mt-2 text-slate-100/90">
                  {project.paymentStructure}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
              <p className="label">Attention note</p>
              <p className="mt-2 text-sm leading-6 text-slate-300/80">
                {secondaryReason}
                {project.hostingEnabled
                  ? ` Hosting is billed at ${formatCurrency(project.hostingAmount)}/mo.`
                  : ""}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className="btn-secondary" href={`/projects/${project.id}`}>
                Open project
              </Link>
              <Link className="btn-secondary" href={`/clients/${project.clientId}`}>
                View client
              </Link>
            </div>
          </article>
        ),
      )}
    </div>
  );
}
