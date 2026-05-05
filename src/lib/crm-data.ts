import {
  type AccountCredential,
  clients as mockClients,
  getClientById as getMockClientById,
  getDashboardStats as getMockDashboardStats,
  getProspects as getMockProspects,
  getTasks as getMockTasks,
  getInvoiceStatusLabel,
  getPaymentStatusLabel,
  getProjectById as getMockProjectById,
  getProjectsForClient as getMockProjectsForClient,
  invoiceStatuses,
  paymentStructures,
  prospects as mockProspects,
  proposalStatuses,
  tasks as mockTasks,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type Prospect,
  type ProspectProposal,
  type ProspectProposalLineItem,
  type ProposalStatus,
  type ProspectStatus,
  projects as mockProjects,
  stages,
  type Client,
  type PaymentStructure,
  type Project,
  type ProjectCredential,
  type ProjectFinanceEntry,
  type ProjectInvoice,
  type ProjectInvoiceLineItem,
  type ProjectPageItem,
} from "@/lib/mock-data";
import { decryptCredentialValue } from "@/lib/credentials";
import { getServerSupabaseClient } from "@/lib/auth";
import {
  getAdminSupabaseClient,
  hasSupabaseEnv,
} from "@/lib/supabase";

type ClientRow = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
};

type ProspectRow = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: ProspectStatus;
  notes: string;
  next_follow_up: string | null;
  estimated_value: number | null;
};

type ProspectProposalRow = {
  id: string;
  prospect_id: string;
  proposal_number: string;
  title: string;
  amount: number;
  status: ProposalStatus;
  sent_date: string | null;
  valid_until: string | null;
  accepted_date: string | null;
  notes: string;
  project_name: string;
  overview: string;
  payment_structure: PaymentStructure;
  installment_count: number | null;
  hosting_enabled: boolean | null;
  hosting_amount: number | null;
  created_at?: string;
};

type ProspectProposalItemRow = {
  id: string;
  proposal_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  sort_order: number;
};

type ProjectRow = {
  attention_priority?: Project["attentionPriority"];
  created_at: string;
  follow_up_date: string | null;
  id: string;
  client_id: string;
  name: string;
  stage: Project["stage"];
  updated_at: string;
  next_action?: string;
  waiting_on?: string;
  working_url?: string;
  live_url?: string;
  contract_amount?: number;
  payment_structure?: PaymentStructure;
  installment_count?: number;
  payments_received_count?: number;
  payment_status?: string;
  hosting_enabled?: boolean;
  hosting_amount?: number;
  homepage_status?: string;
  homepage_notes?: string;
  overview?: string;
};

type TaskRow = {
  id: string;
  title: string;
  details: string;
  due_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: string | null;
  client_id: string | null;
  prospect_id: string | null;
};

type CredentialRow = {
  id: string;
  project_id: string;
  label: string;
  username: string;
  password_value: string;
  url: string;
  notes: string;
};

type AccountCredentialRow = {
  id: string;
  user_id: string;
  label: string;
  username: string;
  password_value: string;
  url: string;
  notes: string;
};

type PageRow = {
  id: string;
  project_id: string;
  title: string;
  status: ProjectPageItem["status"];
  notes: string;
  issues: string;
  sort_order: number;
};

type FinanceRow = {
  id: string;
  project_id: string;
  invoice_id: string | null;
  entry_date: string;
  due_date: string | null;
  kind: ProjectFinanceEntry["kind"];
  amount: number;
  note: string;
  created_at?: string;
};

type InvoiceRow = {
  id: string;
  project_id: string;
  invoice_number: string;
  title: string;
  amount: number;
  status: ProjectInvoice["status"];
  share_enabled: boolean;
  share_token: string | null;
  sent_date: string | null;
  due_date: string | null;
  paid_date: string | null;
  notes: string;
  created_at?: string;
};

type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  sort_order: number;
};

export type SuggestedTaskReason =
  | "invoice-overdue"
  | "project-follow-up"
  | "project-stale"
  | "prospect-follow-up";

export type SuggestedTask = {
  id: string;
  title: string;
  details: string;
  dueDate: string;
  priority: TaskPriority;
  projectId: string;
  clientId: string;
  prospectId: string;
  reason: SuggestedTaskReason;
};

function isDateBeforeToday(value: string) {
  if (!value) {
    return false;
  }

  const today = new Date();
  const todayAtLocalMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const target = new Date(`${value}T00:00:00`);

  return target.getTime() < todayAtLocalMidnight.getTime();
}

function formatContract(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getTodayKey() {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;
}

function addDaysToKey(value: string, days: number) {
  const baseDate = new Date(`${value}T12:00:00`);
  baseDate.setDate(baseDate.getDate() + days);

  return `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, "0")}-${String(
    baseDate.getDate(),
  ).padStart(2, "0")}`;
}

function getDaysBetween(dateKey: string, referenceKey: string) {
  const target = new Date(`${dateKey}T12:00:00`);
  const reference = new Date(`${referenceKey}T12:00:00`);

  return Math.round((target.getTime() - reference.getTime()) / 86400000);
}

function getDaysSinceTimestamp(timestamp: string, referenceKey: string) {
  if (!timestamp) {
    return 0;
  }

  const reference = new Date(`${referenceKey}T12:00:00`);
  const value = new Date(timestamp);

  return Math.floor((reference.getTime() - value.getTime()) / 86400000);
}

function matchesSuggestedTask(task: Task, suggestion: SuggestedTask) {
  return (
    task.status !== "Done" &&
    task.title === suggestion.title &&
    task.projectId === suggestion.projectId &&
    task.clientId === suggestion.clientId &&
    task.prospectId === suggestion.prospectId
  );
}

function compareSuggestedTaskPriority(left: TaskPriority, right: TaskPriority) {
  const priorityOrder: Record<TaskPriority, number> = {
    Urgent: 0,
    High: 1,
    Normal: 2,
    Low: 3,
  };

  return priorityOrder[left] - priorityOrder[right];
}

function buildSuggestedTasks(
  projects: Project[],
  prospects: Prospect[],
  tasks: Task[],
): SuggestedTask[] {
  const todayKey = getTodayKey();
  const upcomingProspectWindowKey = addDaysToKey(todayKey, 3);
  const suggestions: SuggestedTask[] = [];

  for (const project of projects) {
    const openInvoices = project.invoices.filter((invoice) => {
      if (!invoice.dueDate) {
        return false;
      }

      return (
        (invoice.status === "Sent" || invoice.status === "Overdue") &&
        invoice.dueDate < todayKey
      );
    });

    for (const invoice of openInvoices) {
      const daysOverdue = Math.abs(getDaysBetween(invoice.dueDate, todayKey));
      suggestions.push({
        id: `invoice-overdue:${project.id}:${invoice.id}`,
        title: `Follow up on overdue invoice ${invoice.number}`,
        details: `${project.clientName} still has ${invoice.title} open for ${formatContract(
          invoice.amount,
        )}. The due date passed ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} ago.`,
        dueDate: invoice.dueDate,
        priority: daysOverdue >= 4 ? "Urgent" : "High",
        projectId: project.id,
        clientId: project.clientId,
        prospectId: "",
        reason: "invoice-overdue",
      });
    }

    const hasProjectFollowUpDue =
      Boolean(project.followUpDate) && project.followUpDate <= todayKey;

    if (hasProjectFollowUpDue) {
      const daysLate = Math.abs(getDaysBetween(project.followUpDate, todayKey));
      suggestions.push({
        id: `project-follow-up:${project.id}:${project.followUpDate}`,
        title: `Check in on ${project.name}`,
        details:
          daysLate === 0
            ? `A project follow-up is due today for ${project.clientName}.`
            : `A follow-up for ${project.name} is ${daysLate} day${daysLate === 1 ? "" : "s"} overdue.`,
        dueDate: project.followUpDate,
        priority: daysLate >= 2 ? "High" : "Normal",
        projectId: project.id,
        clientId: project.clientId,
        prospectId: "",
        reason: "project-follow-up",
      });
    }

    const daysSinceUpdate = getDaysSinceTimestamp(project.updatedAt, todayKey);
    const canSuggestStaleCheck =
      project.stage !== "Complete" &&
      !hasProjectFollowUpDue &&
      daysSinceUpdate >= 10;

    if (canSuggestStaleCheck) {
      suggestions.push({
        id: `project-stale:${project.id}:${project.updatedAt}`,
        title: `Review stalled project ${project.name}`,
        details: `${project.name} has not been updated in ${daysSinceUpdate} days. It may need an internal check-in or a client nudge.`,
        dueDate: todayKey,
        priority: daysSinceUpdate >= 14 ? "High" : "Normal",
        projectId: project.id,
        clientId: project.clientId,
        prospectId: "",
        reason: "project-stale",
      });
    }
  }

  for (const prospect of prospects) {
    if (!prospect.nextFollowUp || prospect.nextFollowUp > upcomingProspectWindowKey) {
      continue;
    }

    const daysUntilFollowUp = getDaysBetween(prospect.nextFollowUp, todayKey);
    suggestions.push({
      id: `prospect-follow-up:${prospect.id}:${prospect.nextFollowUp}`,
      title: `Follow up with ${prospect.company}`,
      details:
        daysUntilFollowUp < 0
          ? `${prospect.company} is overdue for a follow-up. Move this lead forward or decide whether to pause it.`
          : daysUntilFollowUp === 0
            ? `${prospect.company} is due for follow-up today.`
            : `${prospect.company} has a follow-up coming up in ${daysUntilFollowUp} day${daysUntilFollowUp === 1 ? "" : "s"}.`,
      dueDate: prospect.nextFollowUp,
      priority: daysUntilFollowUp <= 0 ? "High" : "Normal",
      projectId: "",
      clientId: "",
      prospectId: prospect.id,
      reason: "prospect-follow-up",
    });
  }

  return suggestions
    .filter((suggestion) => !tasks.some((task) => matchesSuggestedTask(task, suggestion)))
    .sort((left, right) => {
      const priorityDiff = compareSuggestedTaskPriority(left.priority, right.priority);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return (left.dueDate || "9999-12-31").localeCompare(
        right.dueDate || "9999-12-31",
      );
    });
}

function mapProjectRows(
  projectRows: ProjectRow[],
  clientRows: ClientRow[],
  credentialRows: CredentialRow[],
  pageRows: PageRow[],
  invoiceRows: InvoiceRow[],
  invoiceItemRows: InvoiceItemRow[],
  financeRows: FinanceRow[],
): Project[] {
  const clientsById = new Map(
    clientRows.map((client) => [client.id, client.company]),
  );

  return projectRows.map((project) => {
    const credentials: ProjectCredential[] = credentialRows
      .filter((credential) => credential.project_id === project.id)
      .map((credential) => ({
        id: credential.id,
        label: credential.label,
        username: decryptCredentialValue(credential.username),
        password: decryptCredentialValue(credential.password_value),
        url: credential.url,
        notes: credential.notes,
      }));

    const pageItems: ProjectPageItem[] = pageRows
      .filter((page) => page.project_id === project.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((page) => ({
        id: page.id,
        title: page.title,
        status: page.status,
        notes: page.notes,
        issues: page.issues,
      }));

    const completedPages = pageItems.filter(
      (page) => page.status === "Complete",
    ).length;

    const projectInvoiceRows = invoiceRows
      .filter((invoice) => invoice.project_id === project.id)
      .sort((left, right) => {
        const leftDate = left.sent_date ?? left.due_date ?? left.created_at ?? "";
        const rightDate = right.sent_date ?? right.due_date ?? right.created_at ?? "";
        return new Date(rightDate || 0).getTime() - new Date(leftDate || 0).getTime();
      });

    const financeEntries: ProjectFinanceEntry[] = financeRows
      .filter((entry) => entry.project_id === project.id)
      .sort((left, right) => {
        const dateDiff =
          new Date(right.entry_date).getTime() - new Date(left.entry_date).getTime();

        if (dateDiff !== 0) {
          return dateDiff;
        }

        return (
          new Date(right.created_at ?? right.entry_date).getTime() -
          new Date(left.created_at ?? left.entry_date).getTime()
        );
      })
      .map((entry) => ({
        id: entry.id,
        date: entry.entry_date,
        dueDate: entry.due_date ?? "",
        invoiceId: entry.invoice_id ?? "",
        kind: entry.kind,
        amount: entry.amount ?? 0,
        note: entry.note,
      }));
    const invoices: ProjectInvoice[] = projectInvoiceRows.map((invoice) => {
      const lineItems: ProjectInvoiceLineItem[] = invoiceItemRows
        .filter((item) => item.invoice_id === invoice.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity ?? 1,
          unitPrice: item.unit_price ?? 0,
          amount: (item.quantity ?? 1) * (item.unit_price ?? 0),
        }));
      const linkedPaymentsTotal = financeEntries
        .filter(
          (entry) =>
            entry.kind === "Payment received" && entry.invoiceId === invoice.id,
        )
        .reduce((sum, entry) => sum + entry.amount, 0);
      const derivedAmount =
        lineItems.length > 0
          ? lineItems.reduce((sum, item) => sum + item.amount, 0)
          : invoice.amount ?? 0;

      return {
        id: invoice.id,
        number: invoice.invoice_number,
        title: invoice.title,
        amount: derivedAmount,
        status: invoice.status,
        shareEnabled: invoice.share_enabled ?? false,
        shareToken: invoice.share_token ?? "",
        sentDate: invoice.sent_date ?? "",
        dueDate: invoice.due_date ?? "",
        paidDate: invoice.paid_date ?? "",
        notes: invoice.notes,
        linkedPaymentsTotal,
        lineItems,
      };
    });
    const derivedPaymentsReceivedCount = financeEntries.filter(
      (entry) => entry.kind === "Payment received",
    ).length;
    const issuedInvoicesCountFromRecords = invoices.filter(
      (invoice) => invoice.status !== "Draft" && invoice.status !== "Cancelled",
    ).length;
    const overdueInvoicesCountFromRecords = invoices.filter((invoice) => {
      if (invoice.status === "Overdue") {
        return true;
      }

      return invoice.status === "Sent" && isDateBeforeToday(invoice.dueDate);
    }).length;
    const derivedInvoicesIssuedCount = financeEntries.filter(
      (entry) => entry.kind === "Invoice sent",
    ).length;
    const overdueInvoiceEntriesCount = financeEntries.filter(
      (entry) => entry.kind === "Invoice sent" && isDateBeforeToday(entry.dueDate),
    ).length;
    const paymentsReceivedCount =
      derivedPaymentsReceivedCount > 0
        ? derivedPaymentsReceivedCount
        : project.payments_received_count ?? 0;
    const invoicesIssuedCount =
      issuedInvoicesCountFromRecords > 0
        ? issuedInvoicesCountFromRecords
        : derivedInvoicesIssuedCount > 0
        ? derivedInvoicesIssuedCount
        : 0;
    const overdueInvoicesCount = Math.max(
      overdueInvoicesCountFromRecords > 0
        ? overdueInvoicesCountFromRecords
        : overdueInvoiceEntriesCount - paymentsReceivedCount,
      0,
    );
    const paymentStructureCandidate = project.payment_structure;
    const paymentStructure: PaymentStructure =
      paymentStructureCandidate &&
      paymentStructures.includes(paymentStructureCandidate)
        ? paymentStructureCandidate
        : "Paid in full";

    return {
      attentionPriority: project.attention_priority ?? "Normal",
      createdAt: project.created_at,
      followUpDate: project.follow_up_date ?? "",
      id: project.id,
      clientId: project.client_id,
      clientName: clientsById.get(project.client_id) ?? "Client",
      name: project.name,
      stage: project.stage,
      updatedAt: project.updated_at,
      nextAction: project.next_action ?? "",
      waitingOn: project.waiting_on ?? "",
      workingUrl: project.working_url ?? "",
      liveUrl: project.live_url ?? "",
      contractAmount: project.contract_amount ?? 0,
      contract: formatContract(project.contract_amount ?? 0),
      paymentStructure,
      installmentCount: project.installment_count ?? 0,
      invoicesIssuedCount,
      paymentsReceivedCount,
      overdueInvoicesCount,
      paymentStatus: getPaymentStatusLabel(
        paymentStructure,
        project.installment_count ?? 0,
        invoicesIssuedCount,
        paymentsReceivedCount,
      ),
      invoiceStatus: getInvoiceStatusLabel(
        paymentStructure,
        project.installment_count ?? 0,
        invoicesIssuedCount,
        overdueInvoicesCount,
      ),
      hostingEnabled: project.hosting_enabled ?? false,
      hostingAmount: project.hosting_amount ?? 0,
      homepageStatus: project.homepage_status ?? "Not started",
      homepageNotes: project.homepage_notes ?? "",
      overview: project.overview ?? "",
      completedPages,
      totalPages: pageItems.length,
      credentials,
      pageItems,
      invoices,
      financeEntries,
    };
  });
}

function mapClients(clientRows: ClientRow[], projects: Project[]): Client[] {
  return clientRows.map((client) => ({
    id: client.id,
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    notes: client.notes,
    projectIds: projects
      .filter((project) => project.clientId === client.id)
      .map((project) => project.id),
  }));
}

function mapProspects(
  prospectRows: ProspectRow[],
  proposalRows: ProspectProposalRow[],
  proposalItemRows: ProspectProposalItemRow[],
): Prospect[] {
  return prospectRows.map((prospect) => ({
    id: prospect.id,
    name: prospect.name,
    company: prospect.company,
    email: prospect.email,
    phone: prospect.phone,
    source: prospect.source,
    status: prospect.status,
    notes: prospect.notes,
    nextFollowUp: prospect.next_follow_up ?? "",
    estimatedValue: prospect.estimated_value ?? 0,
    proposals: proposalRows
      .filter((proposal) => proposal.prospect_id === prospect.id)
      .sort((left, right) => {
        const leftDate = left.sent_date ?? left.created_at ?? "";
        const rightDate = right.sent_date ?? right.created_at ?? "";
        return new Date(rightDate || 0).getTime() - new Date(leftDate || 0).getTime();
      })
      .map((proposal) => {
        const lineItems: ProspectProposalLineItem[] = proposalItemRows
          .filter((item) => item.proposal_id === proposal.id)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity ?? 1,
            unitPrice: item.unit_price ?? 0,
            amount: (item.quantity ?? 1) * (item.unit_price ?? 0),
          }));
        const derivedAmount =
          lineItems.length > 0
            ? lineItems.reduce((sum, item) => sum + item.amount, 0)
            : proposal.amount ?? 0;

        return {
          id: proposal.id,
          number: proposal.proposal_number,
          title: proposal.title,
          amount: derivedAmount,
          status: proposalStatuses.includes(proposal.status)
            ? proposal.status
            : "Draft",
          sentDate: proposal.sent_date ?? "",
          validUntil: proposal.valid_until ?? "",
          acceptedDate: proposal.accepted_date ?? "",
          notes: proposal.notes,
          projectName: proposal.project_name,
          overview: proposal.overview,
          paymentStructure: paymentStructures.includes(proposal.payment_structure)
            ? proposal.payment_structure
            : "Paid in full",
          installmentCount: proposal.installment_count ?? 0,
          hostingEnabled: proposal.hosting_enabled ?? false,
          hostingAmount: proposal.hosting_amount ?? 0,
          lineItems,
        } satisfies ProspectProposal;
      }),
  }));
}

function mapTasks(taskRows: TaskRow[]): Task[] {
  return taskRows.map((task) => ({
    id: task.id,
    title: task.title,
    details: task.details,
    dueDate: task.due_date ?? "",
    status: task.status,
    priority: task.priority,
    projectId: task.project_id ?? "",
    clientId: task.client_id ?? "",
    prospectId: task.prospect_id ?? "",
  }));
}

function mapAccountCredentials(rows: AccountCredentialRow[]): AccountCredential[] {
  return rows.map((credential) => ({
    id: credential.id,
    label: credential.label,
    username: decryptCredentialValue(credential.username),
    password: decryptCredentialValue(credential.password_value),
    url: credential.url,
    notes: credential.notes,
  }));
}

async function getReadSupabaseClient() {
  const adminClient = getAdminSupabaseClient();

  if (adminClient) {
    return adminClient;
  }

  return getServerSupabaseClient();
}

export async function getProjects(): Promise<Project[]> {
  if (!hasSupabaseEnv()) {
    return mockProjects;
  }
  const supabase = await getReadSupabaseClient();

  const [
    { data: projectRows, error: projectsError },
    { data: clientRows, error: clientsError },
    { data: credentialRows, error: credentialsError },
    { data: pageRows, error: pagesError },
    { data: invoiceRows, error: invoicesError },
    { data: invoiceItemRows, error: invoiceItemsError },
    { data: financeRows, error: financeError },
  ] =
    await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase
        .from("clients")
        .select("id, company"),
      supabase
        .from("project_credentials")
        .select("id, project_id, label, username, password_value, url, notes"),
      supabase
        .from("project_pages")
        .select("id, project_id, title, status, notes, issues, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("project_invoices")
        .select(
          "id, project_id, invoice_number, title, amount, status, share_enabled, share_token, sent_date, due_date, paid_date, notes, created_at",
        ),
      supabase
        .from("project_invoice_items")
        .select("id, invoice_id, description, quantity, unit_price, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("project_finance_entries")
        .select("id, project_id, invoice_id, entry_date, due_date, kind, amount, note, created_at")
        .order("entry_date", { ascending: false }),
    ]);

  if (
    projectsError ||
    !projectRows
  ) {
    return [];
  }

  if (
    clientsError ||
    credentialsError ||
    pagesError ||
    invoicesError ||
    invoiceItemsError ||
    financeError
  ) {
    // Keep rendering the primary project list even if secondary finance/detail
    // tables are still catching up with schema changes or policies.
  }

  return mapProjectRows(
    projectRows as unknown as ProjectRow[],
    (clientRows ?? []) as ClientRow[],
    (credentialRows ?? []) as CredentialRow[],
    (pageRows ?? []) as PageRow[],
    (invoiceRows ?? []) as InvoiceRow[],
    (invoiceItemRows ?? []) as InvoiceItemRow[],
    (financeRows ?? []) as FinanceRow[],
  );
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  if (!hasSupabaseEnv()) {
    return getMockProjectById(id);
  }

  const projects = await getProjects();
  return projects.find((project) => project.id === id);
}

export async function getClients(): Promise<Client[]> {
  if (!hasSupabaseEnv()) {
    return mockClients;
  }
  const supabase = await getReadSupabaseClient();

  const [projects, { data: clientRows, error }] = await Promise.all([
    getProjects(),
    supabase
      .from("clients")
      .select("id, name, company, email, phone, notes")
      .order("created_at", { ascending: true }),
  ]);

  if (error || !clientRows) {
    return [];
  }

  return mapClients(clientRows as ClientRow[], projects);
}

export async function getProspects(): Promise<Prospect[]> {
  if (!hasSupabaseEnv()) {
    return getMockProspects();
  }

  const supabase = await getReadSupabaseClient();
  const { data, error } = await supabase
    .from("prospects")
    .select(
      "id, name, company, email, phone, source, status, notes, next_follow_up, estimated_value",
    )
    .order("created_at", { ascending: true });

  if (error || !data) {
    return mockProspects;
  }

  const [
    { data: proposalRows, error: proposalsError },
    { data: proposalItemRows, error: proposalItemsError },
  ] = await Promise.all([
    supabase
      .from("prospect_proposals")
      .select(
        "id, prospect_id, proposal_number, title, amount, status, sent_date, valid_until, accepted_date, notes, project_name, overview, payment_structure, installment_count, hosting_enabled, hosting_amount, created_at",
      ),
    supabase
      .from("prospect_proposal_items")
      .select("id, proposal_id, description, quantity, unit_price, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  if (proposalsError || proposalItemsError) {
    return mapProspects(data as ProspectRow[], [], []);
  }

  return mapProspects(
    data as ProspectRow[],
    (proposalRows ?? []) as ProspectProposalRow[],
    (proposalItemRows ?? []) as ProspectProposalItemRow[],
  );
}

export async function getTasks(): Promise<Task[]> {
  if (!hasSupabaseEnv()) {
    return getMockTasks();
  }

  const supabase = await getReadSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, title, details, due_date, status, priority, project_id, client_id, prospect_id",
    )
    .order("due_date", { ascending: true });

  if (error || !data) {
    return mockTasks;
  }

  return mapTasks(data as TaskRow[]);
}

export async function getAccountCredentials(userId: string): Promise<AccountCredential[]> {
  if (!hasSupabaseEnv() || !userId) {
    return [];
  }

  const supabase = await getReadSupabaseClient();
  const { data, error } = await supabase
    .from("account_credentials")
    .select("id, user_id, label, username, password_value, url, notes")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return mapAccountCredentials(data as AccountCredentialRow[]);
}

export async function getSuggestedTasks(): Promise<SuggestedTask[]> {
  const [projects, prospects, tasks] = await Promise.all([
    getProjects(),
    getProspects(),
    getTasks(),
  ]);

  return buildSuggestedTasks(projects, prospects, tasks);
}

export async function getClientById(id: string): Promise<Client | undefined> {
  if (!hasSupabaseEnv()) {
    return getMockClientById(id);
  }

  const clients = await getClients();
  return clients.find((client) => client.id === id);
}

export async function getProjectsForClient(clientId: string): Promise<Project[]> {
  if (!hasSupabaseEnv()) {
    return getMockProjectsForClient(clientId);
  }

  const projects = await getProjects();
  return projects.filter((project) => project.clientId === clientId);
}

export async function getSharedInvoiceByToken(token: string) {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    return undefined;
  }

  const projects = await getProjects();
  const project = projects.find((item) =>
    item.invoices.some(
      (invoice) => invoice.shareEnabled && invoice.shareToken === normalizedToken,
    ),
  );

  if (!project) {
    return undefined;
  }

  const invoice = project.invoices.find(
    (item) => item.shareEnabled && item.shareToken === normalizedToken,
  );

  if (!invoice) {
    return undefined;
  }

  const client = await getClientById(project.clientId);

  return {
    client,
    invoice,
    project,
  };
}

export async function getDashboardStats() {
  if (!hasSupabaseEnv()) {
    return getMockDashboardStats();
  }

  const projects = await getProjects();
  const activeProjects = projects.filter((project) => project.stage !== "Complete");
  const unpaidPipeline = activeProjects.reduce((sum, project) => {
    const numeric = Number(project.contract.replace(/[$,]/g, ""));
    return sum + numeric;
  }, 0);
  const waitingCount = activeProjects.filter((project) =>
    project.homepageStatus.toLowerCase().includes("waiting"),
  ).length;

  return [
    {
      label: "Active projects",
      value: String(activeProjects.length),
      detail: "Across outreach, build, launch prep, and payment follow-up.",
    },
    {
      label: "Unpaid pipeline",
      value: formatContract(unpaidPipeline),
      detail: "Open contract value still in progress or awaiting payment.",
    },
    {
      label: "Waiting on feedback",
      value: String(waitingCount),
      detail: "Projects currently paused on client feedback or approval.",
    },
  ];
}

export { invoiceStatuses, paymentStructures, proposalStatuses, stages };
