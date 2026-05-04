export const stages = [
  "Lead Found",
  "Outreach / Offer Sent",
  "Site Build",
  "Launch Ready",
  "Payment Requested",
  "Complete",
] as const;

export const paymentStructures = [
  "Paid in full",
  "50/50 split",
  "Installments",
] as const;

export const invoiceStatuses = [
  "Draft",
  "Sent",
  "Paid",
  "Overdue",
  "Cancelled",
] as const;

export const proposalStatuses = [
  "Draft",
  "Sent",
  "Accepted",
  "Declined",
] as const;

export type Stage = (typeof stages)[number];
export type PaymentStructure = (typeof paymentStructures)[number];
export type InvoiceStatus = (typeof invoiceStatuses)[number];
export type ProposalStatus = (typeof proposalStatuses)[number];

export function getPaymentMilestoneCount(
  paymentStructure: PaymentStructure,
  installmentCount: number,
) {
  switch (paymentStructure) {
    case "50/50 split":
      return 2;
    case "Installments":
      return Math.max(installmentCount, 1);
    default:
      return 1;
  }
}

export function getPaymentStatusLabel(
  paymentStructure: PaymentStructure,
  installmentCount: number,
  invoicesIssuedCount: number,
  paymentsReceivedCount: number,
) {
  const totalMilestones = getPaymentMilestoneCount(
    paymentStructure,
    installmentCount,
  );
  const invoiceCount = Math.min(Math.max(invoicesIssuedCount, 0), totalMilestones);
  const paidCount = Math.min(Math.max(paymentsReceivedCount, 0), totalMilestones);

  if (paymentStructure === "Paid in full") {
    if (paidCount >= 1) {
      return "Paid in full";
    }

    if (invoiceCount >= 1) {
      return "Invoice sent, awaiting payment";
    }

    return "Full payment not invoiced";
  }

  if (paymentStructure === "50/50 split") {
    if (paidCount >= 2) {
      return "Paid in full (2/2)";
    }

    if (paidCount === 1) {
      return invoiceCount >= 2
        ? "Deposit paid, final invoice open"
        : "Deposit paid, final invoice not sent";
    }

    if (invoiceCount >= 1) {
      return "Deposit invoice sent, awaiting payment";
    }

    return "No deposit invoice sent";
  }

  if (paidCount >= totalMilestones) {
    return `Paid in full (${totalMilestones}/${totalMilestones})`;
  }

  if (paidCount > 0) {
    return `${paidCount}/${totalMilestones} installments paid`;
  }

  if (invoiceCount > 0) {
    return `${invoiceCount}/${totalMilestones} invoices sent, awaiting payment`;
  }

  return "No installments invoiced";
}

export function getInvoiceStatusLabel(
  paymentStructure: PaymentStructure,
  installmentCount: number,
  invoicesIssuedCount: number,
  overdueInvoicesCount = 0,
) {
  const totalMilestones = getPaymentMilestoneCount(
    paymentStructure,
    installmentCount,
  );
  const invoiceCount = Math.min(Math.max(invoicesIssuedCount, 0), totalMilestones);
  const overdueCount = Math.min(
    Math.max(overdueInvoicesCount, 0),
    Math.max(invoiceCount, 0),
  );
  const baseLabel =
    paymentStructure === "Paid in full"
      ? invoiceCount >= 1
        ? "1/1 invoice sent"
        : "No invoice sent"
      : paymentStructure === "50/50 split"
        ? `${invoiceCount}/2 invoices sent`
        : `${invoiceCount}/${totalMilestones} invoices sent`;

  return overdueCount > 0
    ? `${baseLabel} · ${overdueCount} overdue`
    : baseLabel;
}

export type ProjectCredential = {
  id: string;
  label: string;
  username: string;
  password: string;
  url: string;
  notes: string;
};

export type AccountCredential = {
  id: string;
  label: string;
  username: string;
  password: string;
  url: string;
  notes: string;
};

export type ProjectPageItem = {
  id: string;
  title: string;
  status: "Not started" | "In progress" | "Complete";
  notes: string;
  issues: string;
};

export type ProjectInvoice = {
  id: string;
  number: string;
  title: string;
  amount: number;
  status: InvoiceStatus;
  sentDate: string;
  dueDate: string;
  paidDate: string;
  notes: string;
  linkedPaymentsTotal: number;
  lineItems: ProjectInvoiceLineItem[];
  shareEnabled: boolean;
  shareToken: string;
};

export type ProjectInvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type ProjectFinanceEntry = {
  id: string;
  date: string;
  dueDate: string;
  invoiceId: string;
  kind:
    | "Invoice sent"
    | "Payment received"
    | "Hosting billed"
    | "Refund"
    | "Note";
  amount: number;
  note: string;
};

export type Project = {
  attentionPriority: "Low" | "Normal" | "High" | "Urgent";
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  createdAt: string;
  followUpDate: string;
  stage: Stage;
  updatedAt: string;
  nextAction: string;
  waitingOn: string;
  workingUrl: string;
  liveUrl: string;
  contractAmount: number;
  contract: string;
  paymentStructure: PaymentStructure;
  installmentCount: number;
  invoicesIssuedCount: number;
  paymentsReceivedCount: number;
  overdueInvoicesCount: number;
  paymentStatus: string;
  invoiceStatus: string;
  hostingEnabled: boolean;
  hostingAmount: number;
  homepageStatus: string;
  homepageNotes: string;
  overview: string;
  completedPages: number;
  totalPages: number;
  credentials: ProjectCredential[];
  pageItems: ProjectPageItem[];
  invoices: ProjectInvoice[];
  financeEntries: ProjectFinanceEntry[];
};

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  projectIds: string[];
};

export type ProspectStatus =
  | "New lead"
  | "Reached out"
  | "Call booked"
  | "Proposal sent"
  | "On hold";

export type ProspectProposalLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type ProspectProposal = {
  id: string;
  number: string;
  title: string;
  amount: number;
  status: ProposalStatus;
  sentDate: string;
  validUntil: string;
  acceptedDate: string;
  notes: string;
  projectName: string;
  overview: string;
  paymentStructure: PaymentStructure;
  installmentCount: number;
  hostingEnabled: boolean;
  hostingAmount: number;
  lineItems: ProspectProposalLineItem[];
};

export type Prospect = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: ProspectStatus;
  notes: string;
  nextFollowUp: string;
  estimatedValue: number;
  proposals: ProspectProposal[];
};

export type TaskStatus = "To do" | "In progress" | "Waiting" | "Done";

export type TaskPriority = "Low" | "Normal" | "High" | "Urgent";

export type Task = {
  id: string;
  title: string;
  details: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  clientId: string;
  prospectId: string;
};

export const clients: Client[] = [
  {
    id: "client-1",
    name: "Sarah Holloway",
    company: "Holloway Fitness",
    email: "sarah@hollowayfitness.com",
    phone: "(614) 555-0184",
    notes:
      "Needs fast revisions during the homepage round and wants a stronger local SEO angle before launch.",
    projectIds: ["project-1"],
  },
  {
    id: "client-2",
    name: "Marcus Bell",
    company: "Bell Roofing & Exteriors",
    email: "marcus@bellroofing.com",
    phone: "(740) 555-0148",
    notes:
      "Responds fastest by text. Wants trust-focused design and an easier quote request path.",
    projectIds: ["project-2"],
  },
  {
    id: "client-3",
    name: "Tanya Ruiz",
    company: "Ruiz Dental Studio",
    email: "office@ruizdentalstudio.com",
    phone: "(937) 555-0126",
    notes:
      "Interested in ongoing maintenance after launch and has separate logins for hosting, domain, and forms.",
    projectIds: ["project-3", "project-4"],
  },
  {
    id: "client-4",
    name: "Noah Brooks",
    company: "Ridgeview Outdoors",
    email: "hello@ridgeviewoutdoors.com",
    phone: "(513) 555-0189",
    notes:
      "Still deciding between a full redesign and a homepage-only refresh, so outreach needs a clear scope option.",
    projectIds: ["project-5"],
  },
  {
    id: "client-5",
    name: "Kelsey Moore",
    company: "Oak & Ember Catering",
    email: "events@oakembercatering.com",
    phone: "(380) 555-0171",
    notes:
      "Completed project. Good candidate for maintenance retainers and seasonal landing pages later.",
    projectIds: ["project-6"],
  },
];

export const prospects: Prospect[] = [
  {
    id: "prospect-1",
    name: "Alyssa Kent",
    company: "Kent Wellness Co.",
    email: "alyssa@kentwellness.co",
    phone: "(614) 555-0118",
    source: "Instagram",
    status: "Reached out",
    notes:
      "Interested in a cleaner booking-focused homepage and a simple service breakdown. Wants rough pricing first.",
    nextFollowUp: "2026-04-28",
    estimatedValue: 2800,
    proposals: [],
  },
  {
    id: "prospect-2",
    name: "David Mercer",
    company: "Mercer Home Group",
    email: "david@mercerhomegroup.com",
    phone: "(740) 555-0130",
    source: "Referral",
    status: "Call booked",
    notes:
      "Discovery call booked for next week. Current site feels outdated and lead forms are weak.",
    nextFollowUp: "2026-04-26",
    estimatedValue: 4200,
    proposals: [],
  },
  {
    id: "prospect-3",
    name: "Brianna Cole",
    company: "Cole Event Design",
    email: "hello@coleeventdesign.com",
    phone: "(937) 555-0143",
    source: "Website inquiry",
    status: "Proposal sent",
    notes:
      "Sent proposal with a brand-forward wedding/events concept and optional hosting add-on.",
    nextFollowUp: "2026-04-29",
    estimatedValue: 3600,
    proposals: [
      {
        id: "proposal-1",
        number: "PROP-1001",
        title: "Cole Event Design website proposal",
        amount: 3600,
        status: "Sent",
        sentDate: "2026-04-22",
        validUntil: "2026-05-03",
        acceptedDate: "",
        notes:
          "Includes an optional hosting add-on and a streamlined event inquiry flow.",
        projectName: "Cole Event Design Launch",
        overview:
          "Elegant brochure-style site with homepage, services, gallery, about, and contact experience tailored for wedding and event inquiries.",
        paymentStructure: "50/50 split",
        installmentCount: 0,
        hostingEnabled: true,
        hostingAmount: 39,
        lineItems: [
          {
            id: "proposal-item-1",
            description: "Custom website design and build",
            quantity: 1,
            unitPrice: 3200,
            amount: 3200,
          },
          {
            id: "proposal-item-2",
            description: "Inquiry flow setup and launch support",
            quantity: 1,
            unitPrice: 400,
            amount: 400,
          },
        ],
      },
    ],
  },
];

export const tasks: Task[] = [
  {
    id: "task-1",
    title: "Follow up on Holloway homepage copy",
    details:
      "Check in on testimonial headshots and final hero copy so the homepage can move out of waiting.",
    dueDate: "2026-04-28",
    status: "To do",
    priority: "High",
    projectId: "project-1",
    clientId: "client-1",
    prospectId: "",
  },
  {
    id: "task-2",
    title: "Confirm Bell Roofing contact form inbox",
    details:
      "Need final destination inbox before the launch-ready project can move into handoff.",
    dueDate: "2026-04-27",
    status: "In progress",
    priority: "Urgent",
    projectId: "project-2",
    clientId: "client-2",
    prospectId: "",
  },
  {
    id: "task-3",
    title: "Prepare Ruiz final invoice follow-up",
    details:
      "Draft a gentle overdue reminder and confirm whether the client needs anything before paying the final installment.",
    dueDate: "2026-04-29",
    status: "Waiting",
    priority: "Normal",
    projectId: "project-3",
    clientId: "client-3",
    prospectId: "",
  },
  {
    id: "task-4",
    title: "Discovery prep for Mercer Home Group",
    details:
      "Pull example layouts and outline the main conversion issues to cover on the booked call.",
    dueDate: "2026-04-26",
    status: "To do",
    priority: "High",
    projectId: "",
    clientId: "",
    prospectId: "prospect-2",
  },
];

export const projects: Project[] = [
  {
    id: "project-1",
    clientId: "client-1",
    clientName: "Holloway Fitness",
    name: "Holloway Fitness Redesign",
    attentionPriority: "High",
    createdAt: "2026-04-01T13:00:00.000Z",
    followUpDate: "2026-04-24",
    stage: "Site Build",
    nextAction: "Follow up on homepage copy and testimonial headshots.",
    updatedAt: "2026-04-15T15:30:00.000Z",
    waitingOn: "Client copy and approval",
    workingUrl: "preview.kagemedia.dev/holloway",
    liveUrl: "hollowayfitness.com",
    contractAmount: 3800,
    contract: "$3,800",
    paymentStructure: "50/50 split",
    installmentCount: 0,
    invoicesIssuedCount: 1,
    paymentsReceivedCount: 1,
    overdueInvoicesCount: 0,
    paymentStatus: getPaymentStatusLabel("50/50 split", 0, 1, 1),
    invoiceStatus: getInvoiceStatusLabel("50/50 split", 0, 1, 0),
    hostingEnabled: true,
    hostingAmount: 39,
    homepageStatus: "Waiting on client feedback",
    homepageNotes:
      "Homepage layout is built. Hero and class schedule section need final copy and approval from Sarah.",
    overview:
      "Local fitness studio redesign focused on stronger lead capture, faster mobile performance, and cleaner conversion flow for class signups.",
    completedPages: 1,
    totalPages: 6,
    credentials: [
      {
        id: "credential-1",
        label: "SiteGround Hosting",
        username: "sarah.holloway",
        password: "••••••••••",
        url: "tools.siteground.com",
        notes: "Primary hosting account for the migration.",
      },
      {
        id: "credential-2",
        label: "WordPress Admin",
        username: "kage-admin",
        password: "••••••••••",
        url: "preview.kagemedia.dev/holloway/wp-admin",
        notes: "Use this until launch, then rotate once the site goes live.",
      },
    ],
    pageItems: [
      {
        id: "page-1",
        title: "Homepage",
        status: "In progress",
        notes: "Core sections built. Waiting on approved headline copy.",
        issues: "Need updated testimonial headshots.",
      },
      {
        id: "page-2",
        title: "Membership",
        status: "Not started",
        notes: "Will reuse pricing section patterns from homepage.",
        issues: "Need final class package details.",
      },
      {
        id: "page-3",
        title: "About",
        status: "Not started",
        notes: "Use founder story and trainer bios.",
        issues: "",
      },
    ],
    invoices: [
      {
        id: "invoice-1",
        number: "KAGE-1001",
        title: "Kickoff deposit",
        amount: 1900,
        status: "Paid",
        sentDate: "2026-04-02",
        dueDate: "2026-04-12",
        paidDate: "2026-04-05",
        notes: "Deposit invoice sent at kickoff.",
        linkedPaymentsTotal: 1900,
        shareEnabled: true,
        shareToken: "share-invoice-1",
        lineItems: [
          {
            id: "invoice-item-1",
            description: "Website redesign kickoff deposit",
            quantity: 1,
            unitPrice: 1900,
            amount: 1900,
          },
        ],
      },
      {
        id: "invoice-2",
        number: "KAGE-1002",
        title: "Final balance",
        amount: 1900,
        status: "Draft",
        sentDate: "",
        dueDate: "",
        paidDate: "",
        notes: "Hold until final approvals are signed off.",
        linkedPaymentsTotal: 0,
        shareEnabled: false,
        shareToken: "share-invoice-2",
        lineItems: [
          {
            id: "invoice-item-2",
            description: "Final website design and launch balance",
            quantity: 1,
            unitPrice: 1900,
            amount: 1900,
          },
        ],
      },
    ],
    financeEntries: [
      {
        id: "finance-1",
        date: "2026-04-02",
        dueDate: "2026-04-12",
        invoiceId: "invoice-1",
        kind: "Invoice sent",
        amount: 1900,
        note: "Deposit invoice sent at kickoff.",
      },
      {
        id: "finance-2",
        date: "2026-04-05",
        dueDate: "",
        invoiceId: "invoice-1",
        kind: "Payment received",
        amount: 1900,
        note: "Deposit paid via bank transfer.",
      },
    ],
  },
  {
    id: "project-2",
    clientId: "client-2",
    clientName: "Bell Roofing & Exteriors",
    name: "Bell Roofing Growth Site",
    attentionPriority: "Urgent",
    createdAt: "2026-03-20T14:00:00.000Z",
    followUpDate: "2026-04-24",
    stage: "Launch Ready",
    nextAction: "Run final QA and confirm go-live timing.",
    updatedAt: "2026-04-20T12:00:00.000Z",
    waitingOn: "Launch scheduling",
    workingUrl: "staging.kagemedia.dev/bell-roofing",
    liveUrl: "bellroofingohio.com",
    contractAmount: 5400,
    contract: "$5,400",
    paymentStructure: "50/50 split",
    installmentCount: 0,
    invoicesIssuedCount: 2,
    paymentsReceivedCount: 1,
    overdueInvoicesCount: 1,
    paymentStatus: getPaymentStatusLabel("50/50 split", 0, 2, 1),
    invoiceStatus: getInvoiceStatusLabel("50/50 split", 0, 2, 1),
    hostingEnabled: true,
    hostingAmount: 65,
    homepageStatus: "Approved",
    homepageNotes:
      "Homepage approved. Final QA before pointing domain and swapping forms.",
    overview:
      "Trust-first contractor site with stronger quote flow, service area pages, and local SEO structure for roofing searches.",
    completedPages: 3,
    totalPages: 7,
    credentials: [
      {
        id: "credential-3",
        label: "Domain Registrar",
        username: "marcus.bell",
        password: "••••••••••",
        url: "godaddy.com",
        notes: "Needed for DNS changes on launch day.",
      },
      {
        id: "credential-4",
        label: "Google Business",
        username: "office@bellroofing.com",
        password: "••••••••••",
        url: "business.google.com",
        notes: "Use after launch to update website URL.",
      },
    ],
    pageItems: [
      {
        id: "page-4",
        title: "Homepage",
        status: "Complete",
        notes: "Approved by Marcus.",
        issues: "",
      },
      {
        id: "page-5",
        title: "Roof Repair",
        status: "Complete",
        notes: "Service CTA and trust badges added.",
        issues: "",
      },
      {
        id: "page-6",
        title: "Contact",
        status: "In progress",
        notes: "Final form delivery test left.",
        issues: "Need to confirm destination inbox.",
      },
    ],
    invoices: [
      {
        id: "invoice-3",
        number: "KAGE-1003",
        title: "Initial deposit",
        amount: 2700,
        status: "Paid",
        sentDate: "2026-03-22",
        dueDate: "2026-04-01",
        paidDate: "2026-03-28",
        notes: "Deposit paid before content lock.",
        linkedPaymentsTotal: 2700,
        shareEnabled: true,
        shareToken: "share-invoice-3",
        lineItems: [
          {
            id: "invoice-item-3",
            description: "Initial deposit for design and build start",
            quantity: 1,
            unitPrice: 2700,
            amount: 2700,
          },
        ],
      },
      {
        id: "invoice-4",
        number: "KAGE-1004",
        title: "Final launch invoice",
        amount: 2700,
        status: "Overdue",
        sentDate: "2026-04-21",
        dueDate: "2026-04-23",
        paidDate: "",
        notes: "Final payment due before launch handoff.",
        linkedPaymentsTotal: 0,
        shareEnabled: true,
        shareToken: "share-invoice-4",
        lineItems: [
          {
            id: "invoice-item-4",
            description: "Final launch balance and QA closeout",
            quantity: 1,
            unitPrice: 2700,
            amount: 2700,
          },
        ],
      },
    ],
    financeEntries: [
      {
        id: "finance-3",
        date: "2026-03-22",
        dueDate: "2026-04-01",
        invoiceId: "invoice-3",
        kind: "Invoice sent",
        amount: 2700,
        note: "Initial 50% invoice sent.",
      },
      {
        id: "finance-4",
        date: "2026-03-28",
        dueDate: "",
        invoiceId: "invoice-3",
        kind: "Payment received",
        amount: 2700,
        note: "Deposit received.",
      },
      {
        id: "finance-5",
        date: "2026-04-21",
        dueDate: "2026-04-23",
        invoiceId: "invoice-4",
        kind: "Invoice sent",
        amount: 2700,
        note: "Final invoice sent before launch.",
      },
    ],
  },
  {
    id: "project-3",
    clientId: "client-3",
    clientName: "Ruiz Dental Studio",
    name: "Ruiz Dental Launch",
    attentionPriority: "Urgent",
    createdAt: "2026-03-10T16:00:00.000Z",
    followUpDate: "2026-04-24",
    stage: "Payment Requested",
    nextAction: "Follow up on the final invoice.",
    updatedAt: "2026-04-12T11:00:00.000Z",
    waitingOn: "Final payment",
    workingUrl: "preview.kagemedia.dev/ruiz-dental",
    liveUrl: "ruizdentalstudio.com",
    contractAmount: 4600,
    contract: "$4,600",
    paymentStructure: "Installments",
    installmentCount: 3,
    invoicesIssuedCount: 3,
    paymentsReceivedCount: 2,
    overdueInvoicesCount: 1,
    paymentStatus: getPaymentStatusLabel("Installments", 3, 3, 2),
    invoiceStatus: getInvoiceStatusLabel("Installments", 3, 3, 1),
    hostingEnabled: true,
    hostingAmount: 55,
    homepageStatus: "Approved",
    homepageNotes:
      "Site is launched. Final invoice sent and waiting for payment to close out.",
    overview:
      "Modern dental practice launch site with patient trust focus, appointment CTAs, and treatment pages.",
    completedPages: 5,
    totalPages: 5,
    credentials: [
      {
        id: "credential-5",
        label: "Squarespace Domain",
        username: "office@ruizdentalstudio.com",
        password: "••••••••••",
        url: "account.squarespace.com",
        notes: "Old registrar login kept for renewal tracking.",
      },
    ],
    pageItems: [
      {
        id: "page-7",
        title: "Homepage",
        status: "Complete",
        notes: "Approved and live.",
        issues: "",
      },
      {
        id: "page-8",
        title: "Services",
        status: "Complete",
        notes: "Treatments and FAQ published.",
        issues: "",
      },
      {
        id: "page-9",
        title: "New Patients",
        status: "Complete",
        notes: "Forms linked and tested.",
        issues: "",
      },
    ],
    invoices: [
      {
        id: "invoice-5",
        number: "KAGE-1005",
        title: "Installment 1",
        amount: 1533,
        status: "Paid",
        sentDate: "2026-03-14",
        dueDate: "2026-03-21",
        paidDate: "2026-03-18",
        notes: "First installment settled quickly.",
        linkedPaymentsTotal: 1533,
        shareEnabled: true,
        shareToken: "share-invoice-5",
        lineItems: [
          {
            id: "invoice-item-5",
            description: "Installment 1 for website strategy and homepage build",
            quantity: 1,
            unitPrice: 1533,
            amount: 1533,
          },
        ],
      },
      {
        id: "invoice-6",
        number: "KAGE-1006",
        title: "Installment 2",
        amount: 1533,
        status: "Paid",
        sentDate: "2026-03-30",
        dueDate: "2026-04-06",
        paidDate: "2026-04-03",
        notes: "Second installment cleared during QA.",
        linkedPaymentsTotal: 1533,
        shareEnabled: true,
        shareToken: "share-invoice-6",
        lineItems: [
          {
            id: "invoice-item-6",
            description: "Installment 2 for services pages and content integration",
            quantity: 1,
            unitPrice: 1533,
            amount: 1533,
          },
        ],
      },
      {
        id: "invoice-7",
        number: "KAGE-1007",
        title: "Final installment",
        amount: 1534,
        status: "Overdue",
        sentDate: "2026-04-15",
        dueDate: "2026-04-22",
        paidDate: "",
        notes: "Final payment still open after launch.",
        linkedPaymentsTotal: 0,
        shareEnabled: true,
        shareToken: "share-invoice-7",
        lineItems: [
          {
            id: "invoice-item-7",
            description: "Final installment for launch, forms, and post-launch cleanup",
            quantity: 1,
            unitPrice: 1534,
            amount: 1534,
          },
        ],
      },
    ],
    financeEntries: [
      {
        id: "finance-6",
        date: "2026-03-14",
        dueDate: "2026-03-21",
        invoiceId: "invoice-5",
        kind: "Invoice sent",
        amount: 1533,
        note: "Installment 1 sent.",
      },
      {
        id: "finance-7",
        date: "2026-03-18",
        dueDate: "",
        invoiceId: "invoice-5",
        kind: "Payment received",
        amount: 1533,
        note: "Installment 1 received.",
      },
      {
        id: "finance-8",
        date: "2026-03-30",
        dueDate: "2026-04-06",
        invoiceId: "invoice-6",
        kind: "Invoice sent",
        amount: 1533,
        note: "Installment 2 sent.",
      },
      {
        id: "finance-9",
        date: "2026-04-03",
        dueDate: "",
        invoiceId: "invoice-6",
        kind: "Payment received",
        amount: 1533,
        note: "Installment 2 received.",
      },
      {
        id: "finance-10",
        date: "2026-04-15",
        dueDate: "2026-04-22",
        invoiceId: "invoice-7",
        kind: "Invoice sent",
        amount: 1534,
        note: "Final installment sent after launch.",
      },
    ],
  },
  {
    id: "project-4",
    clientId: "client-3",
    clientName: "Ruiz Dental Studio",
    name: "Patient Forms Cleanup",
    attentionPriority: "Normal",
    createdAt: "2026-04-08T10:00:00.000Z",
    followUpDate: "",
    stage: "Lead Found",
    nextAction: "Decide whether this is a standalone add-on or maintenance work.",
    updatedAt: "2026-04-08T10:00:00.000Z",
    waitingOn: "Internal scope decision",
    workingUrl: "Not started",
    liveUrl: "ruizdentalstudio.com/forms",
    contractAmount: 900,
    contract: "$900",
    paymentStructure: "Paid in full",
    installmentCount: 0,
    invoicesIssuedCount: 0,
    paymentsReceivedCount: 0,
    overdueInvoicesCount: 0,
    paymentStatus: getPaymentStatusLabel("Paid in full", 0, 0, 0),
    invoiceStatus: getInvoiceStatusLabel("Paid in full", 0, 0, 0),
    hostingEnabled: false,
    hostingAmount: 0,
    homepageStatus: "Not started",
    homepageNotes:
      "Mini follow-up project. Need to decide whether this stays a small update or becomes part of a maintenance retainer.",
    overview:
      "Potential cleanup project for intake form UX and conversion flow after the main launch wrapped.",
    completedPages: 0,
    totalPages: 2,
    credentials: [],
    pageItems: [
      {
        id: "page-10",
        title: "Patient Forms",
        status: "Not started",
        notes: "Audit current form friction and drop-off points.",
        issues: "",
      },
    ],
    invoices: [],
    financeEntries: [
      {
        id: "finance-11",
        date: "2026-04-08",
        dueDate: "",
        invoiceId: "",
        kind: "Note",
        amount: 0,
        note: "Scope still being decided before any invoice goes out.",
      },
    ],
  },
  {
    id: "project-5",
    clientId: "client-4",
    clientName: "Ridgeview Outdoors",
    name: "Ridgeview Outdoors Refresh",
    attentionPriority: "High",
    createdAt: "2026-04-02T09:30:00.000Z",
    followUpDate: "2026-04-25",
    stage: "Outreach / Offer Sent",
    nextAction: "Check in on the proposal and clarify scope options.",
    updatedAt: "2026-04-05T09:30:00.000Z",
    waitingOn: "Reply to proposal",
    workingUrl: "Proposal only",
    liveUrl: "ridgeviewoutdoors.com",
    contractAmount: 2100,
    contract: "$2,100",
    paymentStructure: "Paid in full",
    installmentCount: 0,
    invoicesIssuedCount: 0,
    paymentsReceivedCount: 0,
    overdueInvoicesCount: 0,
    paymentStatus: getPaymentStatusLabel("Paid in full", 0, 0, 0),
    invoiceStatus: getInvoiceStatusLabel("Paid in full", 0, 0, 0),
    hostingEnabled: false,
    hostingAmount: 0,
    homepageStatus: "Not started",
    homepageNotes:
      "Proposal sent. Waiting to hear whether they want a homepage refresh or a broader site overhaul.",
    overview:
      "Outdoor brand refresh pitch with stronger storytelling, cleaner mobile layout, and improved ecommerce navigation.",
    completedPages: 0,
    totalPages: 4,
    credentials: [],
    pageItems: [
      {
        id: "page-11",
        title: "Homepage",
        status: "Not started",
        notes: "Pending approved scope.",
        issues: "",
      },
    ],
    invoices: [],
    financeEntries: [
      {
        id: "finance-12",
        date: "2026-04-02",
        dueDate: "",
        invoiceId: "",
        kind: "Note",
        amount: 0,
        note: "Proposal sent. No invoice until scope is approved.",
      },
    ],
  },
  {
    id: "project-6",
    clientId: "client-5",
    clientName: "Oak & Ember Catering",
    name: "Oak & Ember Catering",
    attentionPriority: "Low",
    createdAt: "2026-02-15T12:00:00.000Z",
    followUpDate: "",
    stage: "Complete",
    nextAction: "Revisit later for maintenance or seasonal landing pages.",
    updatedAt: "2026-03-25T14:00:00.000Z",
    waitingOn: "",
    workingUrl: "preview.kagemedia.dev/oak-ember",
    liveUrl: "oakembercatering.com",
    contractAmount: 3200,
    contract: "$3,200",
    paymentStructure: "Paid in full",
    installmentCount: 0,
    invoicesIssuedCount: 1,
    paymentsReceivedCount: 1,
    overdueInvoicesCount: 0,
    paymentStatus: getPaymentStatusLabel("Paid in full", 0, 1, 1),
    invoiceStatus: getInvoiceStatusLabel("Paid in full", 0, 1, 0),
    hostingEnabled: true,
    hostingAmount: 49,
    homepageStatus: "Approved",
    homepageNotes:
      "Completed project archived for reference and future add-on work.",
    overview:
      "Polished catering site with event inquiry flow, seasonal menu updates, and gallery-first presentation.",
    completedPages: 5,
    totalPages: 5,
    credentials: [
      {
        id: "credential-6",
        label: "Hosting",
        username: "kelsey@oakembercatering.com",
        password: "••••••••••",
        url: "my.hostingprovider.com",
        notes: "Kept for future maintenance requests.",
      },
    ],
    pageItems: [
      {
        id: "page-12",
        title: "Homepage",
        status: "Complete",
        notes: "Complete.",
        issues: "",
      },
      {
        id: "page-13",
        title: "Menus",
        status: "Complete",
        notes: "Complete.",
        issues: "",
      },
    ],
    invoices: [
      {
        id: "invoice-8",
        number: "KAGE-1008",
        title: "Project closeout",
        amount: 3200,
        status: "Paid",
        sentDate: "2026-02-16",
        dueDate: "2026-02-23",
        paidDate: "2026-02-18",
        notes: "Project paid in full after final delivery.",
        linkedPaymentsTotal: 3200,
        shareEnabled: true,
        shareToken: "share-invoice-8",
        lineItems: [
          {
            id: "invoice-item-8",
            description: "Full website project closeout",
            quantity: 1,
            unitPrice: 3200,
            amount: 3200,
          },
        ],
      },
    ],
    financeEntries: [
      {
        id: "finance-13",
        date: "2026-02-16",
        dueDate: "2026-02-23",
        invoiceId: "invoice-8",
        kind: "Invoice sent",
        amount: 3200,
        note: "Full project invoice sent.",
      },
      {
        id: "finance-14",
        date: "2026-02-18",
        dueDate: "",
        invoiceId: "invoice-8",
        kind: "Payment received",
        amount: 3200,
        note: "Project paid in full.",
      },
      {
        id: "finance-15",
        date: "2026-04-01",
        dueDate: "2026-04-01",
        invoiceId: "",
        kind: "Hosting billed",
        amount: 49,
        note: "Monthly hosting charge.",
      },
    ],
  },
];

export function getClientById(id: string) {
  return clients.find((client) => client.id === id);
}

export function getProspectById(id: string) {
  return prospects.find((prospect) => prospect.id === id);
}

export function getProspects() {
  return prospects;
}

export function getTasks() {
  return tasks;
}

export function getProjectsForClient(clientId: string) {
  return projects.filter((project) => project.clientId === clientId);
}

export function getProjectById(id: string) {
  return projects.find((project) => project.id === id);
}

export function getDashboardStats() {
  return [
    {
      label: "Active projects",
      value: "5",
      detail: "Across outreach, build, launch prep, and payment follow-up.",
    },
    {
      label: "Unpaid pipeline",
      value: "$16.8k",
      detail: "Open contract value still in progress or awaiting payment.",
    },
    {
      label: "Waiting on feedback",
      value: "1",
      detail: "One site build is paused until the homepage gets approved.",
    },
  ];
}
