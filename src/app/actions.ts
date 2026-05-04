"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirectWithFeedback } from "@/lib/feedback";
import { encryptCredentialValue } from "@/lib/credentials";
import { getAllowedEmail, getServerSupabaseClient } from "@/lib/auth";
import { getAdminSupabaseClient } from "@/lib/supabase";
import {
  invoiceStatuses,
  paymentStructures,
  proposalStatuses,
  type TaskPriority,
  type TaskStatus,
  stages,
  type ProposalStatus,
  type ProspectStatus,
  type ProjectPageItem,
} from "@/lib/mock-data";

function requiredString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseCurrencyInput(value: string) {
  const numeric = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseWholeNumberInput(value: string) {
  const numeric = Number(value.trim());
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : 0;
}

function parsePositiveNumberInput(value: string) {
  const numeric = Number(value.trim().replace(/[$,\s]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

async function getActionSupabaseClient() {
  const adminClient = getAdminSupabaseClient();

  if (adminClient) {
    return adminClient;
  }

  return getServerSupabaseClient({ writeCookies: true });
}

async function getAuthenticatedActionUser() {
  const supabase = await getServerSupabaseClient({ writeCookies: true });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const allowedEmail = getAllowedEmail();

  if (allowedEmail && user.email.toLowerCase() !== allowedEmail) {
    return null;
  }

  return user;
}

function getInvoiceLineItems(formData: FormData) {
  const descriptions = formData.getAll("lineItemDescription");
  const quantities = formData.getAll("lineItemQuantity");
  const unitPrices = formData.getAll("lineItemUnitPrice");

  return descriptions
    .map((descriptionValue, index) => {
      const description = String(descriptionValue ?? "").trim();
      const quantity = parsePositiveNumberInput(String(quantities[index] ?? "1")) || 1;
      const unitPrice = parseCurrencyInput(String(unitPrices[index] ?? "0"));

      if (!description) {
        return null;
      }

      return {
        id: `invoice-item-${crypto.randomUUID()}`,
        description,
        quantity,
        unit_price: unitPrice,
        sort_order: index,
      };
    })
    .filter(
      (
        item,
      ): item is {
        id: string;
        description: string;
        quantity: number;
        unit_price: number;
        sort_order: number;
      } => item !== null,
    );
}

function getProposalLineItems(formData: FormData) {
  const descriptions = formData.getAll("proposalLineItemDescription");
  const quantities = formData.getAll("proposalLineItemQuantity");
  const unitPrices = formData.getAll("proposalLineItemUnitPrice");

  return descriptions
    .map((descriptionValue, index) => {
      const description = String(descriptionValue ?? "").trim();
      const quantity = parsePositiveNumberInput(String(quantities[index] ?? "1")) || 1;
      const unitPrice = parseCurrencyInput(String(unitPrices[index] ?? "0"));

      if (!description) {
        return null;
      }

      return {
        id: `proposal-item-${crypto.randomUUID()}`,
        description,
        quantity,
        unit_price: unitPrice,
        sort_order: index,
      };
    })
    .filter(
      (
        item,
      ): item is {
        id: string;
        description: string;
        quantity: number;
        unit_price: number;
        sort_order: number;
      } => item !== null,
    );
}

function getProjectPageItems(formData: FormData) {
  const titles = formData.getAll("pageTitle");
  const statuses = formData.getAll("pageStatus");
  const notes = formData.getAll("pageNotes");
  const issues = formData.getAll("pageIssues");

  return titles
    .map((titleValue, index) => {
      const title = String(titleValue ?? "").trim();

      if (!title) {
        return null;
      }

      const statusInput = String(statuses[index] ?? "Not started").trim();
      const status = (
        ["Not started", "In progress", "Complete"] as ProjectPageItem["status"][]
      ).includes(statusInput as ProjectPageItem["status"])
        ? (statusInput as ProjectPageItem["status"])
        : "Not started";

      return {
        id: `page-${crypto.randomUUID()}`,
        title,
        status,
        notes: String(notes[index] ?? "").trim(),
        issues: String(issues[index] ?? "").trim(),
        sort_order: index + 1,
      };
    })
    .filter(
      (
        item,
      ): item is {
        id: string;
        issues: string;
        notes: string;
        sort_order: number;
        status: ProjectPageItem["status"];
        title: string;
      } => item !== null,
    );
}

function revalidateProjectSurface(projectId?: string) {
  revalidatePath("/");
  revalidatePath("/clients");
  revalidatePath("/prospects");
  revalidatePath("/projects");
  revalidatePath("/tasks");

  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
}

function throwIfSupabaseError(error: { message?: string } | null) {
  if (error) {
    throw new Error(error.message ?? "Supabase request failed.");
  }
}

function getMissingColumnName(error: { message?: string } | null | undefined) {
  const message = error?.message ?? "";

  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column "([^"]+)" of relation/i,
    /record "[^"]+" has no field "([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function rethrowIfRedirectError(error: unknown) {
  if (isRedirectError(error)) {
    throw error;
  }
}

async function insertWithColumnCompatibility(
  table: string,
  payload: Record<string, unknown>,
  options?: {
    requiredColumns?: string[];
  },
) {
  const supabase = await getActionSupabaseClient();
  const mutablePayload = { ...payload };
  const requiredColumns = new Set(options?.requiredColumns ?? []);

  for (let attempt = 0; attempt < Object.keys(payload).length; attempt += 1) {
    const { error } = await supabase.from(table).insert(mutablePayload);

    if (!error) {
      return;
    }

    const missingColumn = getMissingColumnName(error);

    if (!missingColumn || !(missingColumn in mutablePayload)) {
      throwIfSupabaseError(error);
    }

    if (requiredColumns.has(missingColumn)) {
      throw new Error(
        `Your Supabase schema is missing the \`${missingColumn}\` column. Run the latest schema update before saving this project.`,
      );
    }

    delete mutablePayload[missingColumn];
  }

  throw new Error(`Could not insert into ${table}.`);
}

async function updateWithColumnCompatibility(
  table: string,
  payload: Record<string, unknown>,
  filters: Record<string, string>,
  options?: {
    requiredColumns?: string[];
  },
) {
  const supabase = await getActionSupabaseClient();
  const mutablePayload = { ...payload };
  const requiredColumns = new Set(options?.requiredColumns ?? []);

  for (let attempt = 0; attempt < Object.keys(payload).length; attempt += 1) {
    let query = supabase.from(table).update(mutablePayload);

    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { error } = await query;

    if (!error) {
      return;
    }

    const missingColumn = getMissingColumnName(error);

    if (!missingColumn || !(missingColumn in mutablePayload)) {
      throwIfSupabaseError(error);
    }

    if (requiredColumns.has(missingColumn)) {
      throw new Error(
        `Your Supabase schema is missing the \`${missingColumn}\` column. Run the latest schema update before saving this project.`,
      );
    }

    delete mutablePayload[missingColumn];
  }

  throw new Error(`Could not update ${table}.`);
}

function getPaymentFields(formData: FormData) {
  const paymentStructureInput = requiredString(formData, "paymentStructure");
  const paymentStructure = paymentStructures.includes(
    paymentStructureInput as (typeof paymentStructures)[number],
  )
    ? paymentStructureInput
    : "Paid in full";
  const installmentCount =
    paymentStructure === "Installments"
      ? parseWholeNumberInput(optionalString(formData, "installmentCount"))
      : 0;
  const hostingAmount = parseCurrencyInput(optionalString(formData, "hostingAmount"));
  const hostingEnabled =
    formData.get("hostingEnabled") === "on" || hostingAmount > 0;

  return {
    payment_structure: paymentStructure,
    installment_count: installmentCount,
    hosting_enabled: hostingEnabled,
    hosting_amount: hostingEnabled ? hostingAmount : 0,
  };
}

function getProspectStatus(formData: FormData) {
  const statusInput = requiredString(formData, "status");
  const allowedStatuses = [
    "New lead",
    "Reached out",
    "Call booked",
    "Proposal sent",
    "On hold",
  ] as const satisfies ProspectStatus[];

  return allowedStatuses.includes(statusInput as ProspectStatus)
    ? (statusInput as ProspectStatus)
    : "New lead";
}

function getTaskStatus(formData: FormData) {
  const statusInput = requiredString(formData, "status");
  const allowedStatuses = [
    "To do",
    "In progress",
    "Waiting",
    "Done",
  ] as const satisfies TaskStatus[];

  return allowedStatuses.includes(statusInput as TaskStatus)
    ? (statusInput as TaskStatus)
    : "To do";
}

function getTaskPriority(formData: FormData) {
  const priorityInput = requiredString(formData, "priority");
  const allowedPriorities = [
    "Low",
    "Normal",
    "High",
    "Urgent",
  ] as const satisfies TaskPriority[];

  return allowedPriorities.includes(priorityInput as TaskPriority)
    ? (priorityInput as TaskPriority)
    : "Normal";
}

function getProposalStatus(formData: FormData) {
  const statusInput = requiredString(formData, "status");

  return proposalStatuses.includes(statusInput as ProposalStatus)
    ? (statusInput as ProposalStatus)
    : "Draft";
}

export async function signInWithPasswordAction(formData: FormData) {
  const email = requiredString(formData, "email").toLowerCase();
  const password = requiredString(formData, "password");
  const allowedEmail = getAllowedEmail();

  if (allowedEmail && email !== allowedEmail) {
    redirect("/login?message=Use%20your%20authorized%20email.&type=error");
  }

  const supabase = await getServerSupabaseClient({ writeCookies: true });
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?message=Incorrect%20email%20or%20password.&type=error");
  }

  redirect("/");
}

export async function signOutAction() {
  const supabase = await getServerSupabaseClient({ writeCookies: true });
  await supabase.auth.signOut();
  redirect("/login?message=Signed%20out.&type=success");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = requiredString(formData, "email").toLowerCase();
  const allowedEmail = getAllowedEmail();

  if (allowedEmail && email !== allowedEmail) {
    redirect("/login?message=Use%20your%20authorized%20email.&type=error");
  }

  const supabase = await getServerSupabaseClient({ writeCookies: true });
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    redirect("/login?message=Could%20not%20send%20reset%20email.&type=error");
  }

  redirect("/login?message=Password%20reset%20email%20sent.&type=success");
}

export async function changePasswordAction(formData: FormData) {
  const password = requiredString(formData, "password");
  const confirmPassword = requiredString(formData, "confirmPassword");
  const redirectPath = optionalString(formData, "redirectTo") || "/account";

  if (password.length < 8) {
    await redirectWithFeedback({
      fallbackPath: redirectPath,
      message: "Password must be at least 8 characters.",
      type: "error",
    });
  }

  if (password !== confirmPassword) {
    await redirectWithFeedback({
      fallbackPath: redirectPath,
      message: "Passwords do not match.",
      type: "error",
    });
  }

  const supabase = await getServerSupabaseClient({ writeCookies: true });
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    await redirectWithFeedback({
      fallbackPath: redirectPath,
      message: "Could not update password.",
      type: "error",
    });
  }

  await redirectWithFeedback({
    fallbackPath: redirectPath,
    message: "Password updated.",
  });
}

export async function updateAccountAction(formData: FormData) {
  const displayName = requiredString(formData, "displayName");
  const redirectPath = optionalString(formData, "redirectTo") || "/account";

  if (displayName.length < 2) {
    await redirectWithFeedback({
      fallbackPath: redirectPath,
      message: "Display name must be at least 2 characters.",
      type: "error",
    });
  }

  const supabase = await getServerSupabaseClient({ writeCookies: true });
  const { error } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
    },
  });

  if (error) {
    await redirectWithFeedback({
      fallbackPath: redirectPath,
      message: "Could not update profile.",
      type: "error",
    });
  }

  revalidatePath("/account");
  await redirectWithFeedback({
    fallbackPath: redirectPath,
    message: "Profile updated.",
  });
}

export async function createClientAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const redirectTo = optionalString(formData, "redirectTo");
    const id = `client-${crypto.randomUUID()}`;
    const payload = {
      id,
      name: requiredString(formData, "name"),
      company: requiredString(formData, "company"),
      email: optionalString(formData, "email"),
      phone: optionalString(formData, "phone"),
      notes: optionalString(formData, "notes"),
    };
    const { error } = await supabase.from("clients").insert(payload);
    throwIfSupabaseError(error);
    revalidateProjectSurface();
    await redirectWithFeedback({
      fallbackPath: "/clients",
      message: "Client added.",
      path: redirectTo || undefined,
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    const redirectTo = optionalString(formData, "redirectTo");
    await redirectWithFeedback({
      fallbackPath: "/clients",
      message: "Could not add client.",
      path: redirectTo || undefined,
      type: "error",
    });
  }
}

export async function updateClientAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const payload = {
      name: requiredString(formData, "name"),
      company: requiredString(formData, "company"),
      email: optionalString(formData, "email"),
      phone: optionalString(formData, "phone"),
      notes: optionalString(formData, "notes"),
    };
    const { error } = await supabase.from("clients").update(payload).eq("id", id);
    throwIfSupabaseError(error);
    revalidateProjectSurface();
    await redirectWithFeedback({ fallbackPath: "/clients", message: "Client updated." });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({ fallbackPath: "/clients", message: "Could not update client.", type: "error" });
  }
}

export async function deleteClientAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const { data, error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .select("id");
    throwIfSupabaseError(error);
    if (!data || data.length === 0) {
      throw new Error("Client delete was blocked or the record was not found.");
    }
    revalidateProjectSurface();
    revalidatePath("/finance");
    await redirectWithFeedback({
      fallbackPath: "/clients",
      message: "Client deleted.",
      path: "/",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/clients",
      message:
        error instanceof Error ? error.message : "Could not delete client.",
      type: "error",
    });
  }
}

export async function createProspectAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const payload = {
      id: `prospect-${crypto.randomUUID()}`,
      name: requiredString(formData, "name"),
      company: requiredString(formData, "company"),
      email: optionalString(formData, "email"),
      phone: optionalString(formData, "phone"),
      source: optionalString(formData, "source"),
      status: getProspectStatus(formData),
      notes: optionalString(formData, "notes"),
      next_follow_up: optionalString(formData, "nextFollowUp") || null,
      estimated_value: parseCurrencyInput(optionalString(formData, "estimatedValue")),
    };
    const { error } = await supabase.from("prospects").insert(payload);
    throwIfSupabaseError(error);
    revalidateProjectSurface();
    await redirectWithFeedback({
      fallbackPath: "/prospects",
      message: "Prospect added.",
      path: "/prospects",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/prospects",
      message: error instanceof Error ? error.message : "Could not add prospect.",
      path: "/prospects",
      type: "error",
    });
  }
}

export async function updateProspectAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const payload = {
      name: requiredString(formData, "name"),
      company: requiredString(formData, "company"),
      email: optionalString(formData, "email"),
      phone: optionalString(formData, "phone"),
      source: optionalString(formData, "source"),
      status: getProspectStatus(formData),
      notes: optionalString(formData, "notes"),
      next_follow_up: optionalString(formData, "nextFollowUp") || null,
      estimated_value: parseCurrencyInput(optionalString(formData, "estimatedValue")),
    };
    const { error } = await supabase.from("prospects").update(payload).eq("id", id);
    throwIfSupabaseError(error);
    revalidateProjectSurface();
    await redirectWithFeedback({
      fallbackPath: "/prospects",
      message: "Prospect updated.",
      path: "/prospects",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/prospects",
      message: error instanceof Error ? error.message : "Could not update prospect.",
      path: "/prospects",
      type: "error",
    });
  }
}

export async function deleteProspectAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const { error } = await supabase.from("prospects").delete().eq("id", id);
    throwIfSupabaseError(error);
    revalidateProjectSurface();
    await redirectWithFeedback({
      fallbackPath: "/prospects",
      message: "Prospect deleted.",
      path: "/prospects",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/prospects",
      message: error instanceof Error ? error.message : "Could not delete prospect.",
      path: "/prospects",
      type: "error",
    });
  }
}

export async function convertProspectToClientAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const prospectId = requiredString(formData, "id");
    const payload = {
      id: `client-${crypto.randomUUID()}`,
      name: requiredString(formData, "name"),
      company: requiredString(formData, "company"),
      email: optionalString(formData, "email"),
      phone: optionalString(formData, "phone"),
      notes: optionalString(formData, "notes"),
    };
    const { error: clientError } = await supabase.from("clients").insert(payload);
    throwIfSupabaseError(clientError);
    const { error: prospectError } = await supabase.from("prospects").delete().eq("id", prospectId);
    throwIfSupabaseError(prospectError);
    revalidateProjectSurface();
    await redirectWithFeedback({
      fallbackPath: "/clients",
      message: "Prospect converted to client.",
      path: `/clients/${payload.id}`,
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/prospects",
      message:
        error instanceof Error ? error.message : "Could not convert prospect.",
      path: "/prospects",
      type: "error",
    });
  }
}

export async function createProposalAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const prospectId = requiredString(formData, "prospectId");
    const lineItems = getProposalLineItems(formData);
    const status = getProposalStatus(formData);
    const derivedAmount =
      lineItems.length > 0
        ? lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
        : parseCurrencyInput(optionalString(formData, "amount"));
    const proposalId = `proposal-${crypto.randomUUID()}`;
    const paymentFields = getPaymentFields(formData);
    const payload = {
      id: proposalId,
      prospect_id: prospectId,
      proposal_number: requiredString(formData, "proposalNumber"),
      title: requiredString(formData, "title"),
      amount: derivedAmount,
      status,
      sent_date: optionalString(formData, "sentDate") || null,
      valid_until: optionalString(formData, "validUntil") || null,
      accepted_date:
        status === "Accepted"
          ? optionalString(formData, "acceptedDate") || new Date().toISOString().slice(0, 10)
          : optionalString(formData, "acceptedDate") || null,
      notes: optionalString(formData, "notes"),
      project_name: optionalString(formData, "projectName"),
      overview: optionalString(formData, "overview"),
      ...paymentFields,
    };
    const { error } = await supabase.from("prospect_proposals").insert(payload);
    throwIfSupabaseError(error);

    if (lineItems.length > 0) {
      const { error: itemError } = await supabase.from("prospect_proposal_items").insert(
        lineItems.map((item) => ({
          ...item,
          proposal_id: proposalId,
        })),
      );
      throwIfSupabaseError(itemError);
    }

    if (status === "Sent") {
      await supabase
        .from("prospects")
        .update({ status: "Proposal sent" })
        .eq("id", prospectId);
    }

    revalidateProjectSurface();
    await redirectWithFeedback({
      fallbackPath: "/prospects",
      message: "Proposal created.",
      path: "/prospects",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/prospects",
      message: error instanceof Error ? error.message : "Could not create proposal.",
      path: "/prospects",
      type: "error",
    });
  }
}

export async function updateProposalAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const prospectId = requiredString(formData, "prospectId");
    const lineItems = getProposalLineItems(formData);
    const status = getProposalStatus(formData);
    const derivedAmount =
      lineItems.length > 0
        ? lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
        : parseCurrencyInput(optionalString(formData, "amount"));
    const paymentFields = getPaymentFields(formData);
    const payload = {
      proposal_number: requiredString(formData, "proposalNumber"),
      title: requiredString(formData, "title"),
      amount: derivedAmount,
      status,
      sent_date: optionalString(formData, "sentDate") || null,
      valid_until: optionalString(formData, "validUntil") || null,
      accepted_date:
        status === "Accepted"
          ? optionalString(formData, "acceptedDate") || new Date().toISOString().slice(0, 10)
          : optionalString(formData, "acceptedDate") || null,
      notes: optionalString(formData, "notes"),
      project_name: optionalString(formData, "projectName"),
      overview: optionalString(formData, "overview"),
      ...paymentFields,
    };
    const { error } = await supabase.from("prospect_proposals").update(payload).eq("id", id);
    throwIfSupabaseError(error);

    const { error: deleteItemsError } = await supabase
      .from("prospect_proposal_items")
      .delete()
      .eq("proposal_id", id);
    throwIfSupabaseError(deleteItemsError);

    if (lineItems.length > 0) {
      const { error: itemError } = await supabase.from("prospect_proposal_items").insert(
        lineItems.map((item) => ({
          ...item,
          proposal_id: id,
        })),
      );
      throwIfSupabaseError(itemError);
    }

    if (status === "Sent") {
      await supabase
        .from("prospects")
        .update({ status: "Proposal sent" })
        .eq("id", prospectId);
    }

    revalidateProjectSurface();
    await redirectWithFeedback({
      fallbackPath: "/prospects",
      message: "Proposal updated.",
      path: "/prospects",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/prospects",
      message: error instanceof Error ? error.message : "Could not update proposal.",
      path: "/prospects",
      type: "error",
    });
  }
}

export async function deleteProposalAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const { error } = await supabase.from("prospect_proposals").delete().eq("id", id);
    throwIfSupabaseError(error);
    revalidateProjectSurface();
    await redirectWithFeedback({
      fallbackPath: "/prospects",
      message: "Proposal deleted.",
      path: "/prospects",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/prospects",
      message: error instanceof Error ? error.message : "Could not delete proposal.",
      path: "/prospects",
      type: "error",
    });
  }
}

export async function convertProposalToProjectAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const prospectId = requiredString(formData, "prospectId");
    const proposalId = requiredString(formData, "proposalId");
    const clientId = `client-${crypto.randomUUID()}`;
    const projectId = `project-${crypto.randomUUID()}`;
    const clientPayload = {
      id: clientId,
      name: requiredString(formData, "name"),
      company: requiredString(formData, "company"),
      email: optionalString(formData, "email"),
      phone: optionalString(formData, "phone"),
      notes: optionalString(formData, "clientNotes"),
    };
    const { error: clientError } = await supabase.from("clients").insert(clientPayload);
    throwIfSupabaseError(clientError);

    const projectPayload = {
      id: projectId,
      client_id: clientId,
      name: requiredString(formData, "projectName"),
      stage: "Site Build",
      attention_priority: "Normal",
      follow_up_date: optionalString(formData, "followUpDate") || null,
      working_url: "",
      live_url: "",
      next_action: "Schedule kickoff and collect project assets.",
      contract_amount: parseCurrencyInput(optionalString(formData, "contractAmount")),
      payment_structure: requiredString(formData, "paymentStructure"),
      installment_count: parseWholeNumberInput(optionalString(formData, "installmentCount")),
      hosting_enabled: formData.get("hostingEnabled") === "on",
      hosting_amount: parseCurrencyInput(optionalString(formData, "hostingAmount")),
      homepage_status: "Not started",
      homepage_notes: "",
      overview: optionalString(formData, "overview") || optionalString(formData, "clientNotes"),
      waiting_on: "Kickoff materials and brand assets",
    };
    await insertWithColumnCompatibility("projects", projectPayload, {
      requiredColumns: [
        "payment_structure",
        "installment_count",
        "hosting_enabled",
        "hosting_amount",
      ],
    });

    const { error: proposalError } = await supabase
      .from("prospect_proposals")
      .update({
        status: "Accepted",
        accepted_date: optionalString(formData, "acceptedDate") || new Date().toISOString().slice(0, 10),
      })
      .eq("id", proposalId);
    throwIfSupabaseError(proposalError);

    const { error: prospectError } = await supabase.from("prospects").delete().eq("id", prospectId);
    throwIfSupabaseError(prospectError);

    revalidateProjectSurface(projectId);
    await redirectWithFeedback({
      fallbackPath: "/projects",
      message: "Accepted proposal converted into a client and project.",
      path: `/projects/${projectId}`,
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/prospects",
      message:
        error instanceof Error
          ? error.message
          : "Could not convert accepted proposal into a project.",
      path: "/prospects",
      type: "error",
    });
  }
}

export async function createTaskAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const redirectTo = optionalString(formData, "redirectTo") || "/tasks";
    const payload = {
      id: `task-${crypto.randomUUID()}`,
      title: requiredString(formData, "title"),
      details: optionalString(formData, "details"),
      due_date: optionalString(formData, "dueDate") || null,
      status: getTaskStatus(formData),
      priority: getTaskPriority(formData),
      project_id: optionalString(formData, "projectId") || null,
      client_id: optionalString(formData, "clientId") || null,
      prospect_id: optionalString(formData, "prospectId") || null,
    };
    const { error } = await supabase.from("tasks").insert(payload);
    throwIfSupabaseError(error);
    revalidateProjectSurface();
    await redirectWithFeedback({
      fallbackPath: redirectTo,
      message: "Task added.",
      path: redirectTo,
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    const redirectTo = optionalString(formData, "redirectTo") || "/tasks";
    await redirectWithFeedback({
      fallbackPath: redirectTo,
      message: error instanceof Error ? error.message : "Could not add task.",
      path: redirectTo,
      type: "error",
    });
  }
}

export async function createSuggestedTaskAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const redirectTo = optionalString(formData, "redirectTo") || "/tasks";
    const title = requiredString(formData, "title");
    const projectId = optionalString(formData, "projectId") || null;
    const clientId = optionalString(formData, "clientId") || null;
    const prospectId = optionalString(formData, "prospectId") || null;
    const dueDate = optionalString(formData, "dueDate") || null;
    const { data: existingTasks, error: existingTasksError } = await supabase
      .from("tasks")
      .select("id, status, project_id, client_id, prospect_id")
      .eq("title", title);
    throwIfSupabaseError(existingTasksError);

    const hasOpenMatch =
      existingTasks?.some(
        (task) =>
          task.status !== "Done" &&
          task.project_id === projectId &&
          task.client_id === clientId &&
          task.prospect_id === prospectId,
      ) ?? false;

    if (hasOpenMatch) {
      await redirectWithFeedback({
        fallbackPath: redirectTo,
        message: "That reminder is already being tracked as an open task.",
        path: redirectTo,
      });
    }

    const payload = {
      id: `task-${crypto.randomUUID()}`,
      title,
      details: optionalString(formData, "details"),
      due_date: dueDate,
      status: "To do",
      priority: getTaskPriority(formData),
      project_id: projectId,
      client_id: clientId,
      prospect_id: prospectId,
    };
    const { error } = await supabase.from("tasks").insert(payload);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId ?? undefined);
    await redirectWithFeedback({
      fallbackPath: redirectTo,
      message: "Suggested task added.",
      path: redirectTo,
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    const redirectTo = optionalString(formData, "redirectTo") || "/tasks";
    await redirectWithFeedback({
      fallbackPath: redirectTo,
      message:
        error instanceof Error ? error.message : "Could not add suggested task.",
      path: redirectTo,
      type: "error",
    });
  }
}

export async function updateTaskAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const redirectTo = optionalString(formData, "redirectTo") || "/tasks";
    const id = requiredString(formData, "id");
    const payload = {
      title: requiredString(formData, "title"),
      details: optionalString(formData, "details"),
      due_date: optionalString(formData, "dueDate") || null,
      status: getTaskStatus(formData),
      priority: getTaskPriority(formData),
      project_id: optionalString(formData, "projectId") || null,
      client_id: optionalString(formData, "clientId") || null,
      prospect_id: optionalString(formData, "prospectId") || null,
    };
    const { error } = await supabase.from("tasks").update(payload).eq("id", id);
    throwIfSupabaseError(error);
    revalidateProjectSurface();
    await redirectWithFeedback({
      fallbackPath: redirectTo,
      message: "Task updated.",
      path: redirectTo,
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    const redirectTo = optionalString(formData, "redirectTo") || "/tasks";
    await redirectWithFeedback({
      fallbackPath: redirectTo,
      message: error instanceof Error ? error.message : "Could not update task.",
      path: redirectTo,
      type: "error",
    });
  }
}

export async function updateTaskStatusAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const redirectTo = optionalString(formData, "redirectTo") || "/tasks";
    const id = requiredString(formData, "id");
    const status = getTaskStatus(formData);
    const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
    throwIfSupabaseError(error);
    revalidateProjectSurface();
    await redirectWithFeedback({
      fallbackPath: redirectTo,
      message: "Task status updated.",
      path: redirectTo,
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    const redirectTo = optionalString(formData, "redirectTo") || "/tasks";
    await redirectWithFeedback({
      fallbackPath: redirectTo,
      message: error instanceof Error ? error.message : "Could not update task status.",
      path: redirectTo,
      type: "error",
    });
  }
}

export async function deleteTaskAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const redirectTo = optionalString(formData, "redirectTo") || "/tasks";
    const id = requiredString(formData, "id");
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    throwIfSupabaseError(error);
    revalidateProjectSurface();
    await redirectWithFeedback({
      fallbackPath: redirectTo,
      message: "Task deleted.",
      path: redirectTo,
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    const redirectTo = optionalString(formData, "redirectTo") || "/tasks";
    await redirectWithFeedback({
      fallbackPath: redirectTo,
      message: error instanceof Error ? error.message : "Could not delete task.",
      path: redirectTo,
      type: "error",
    });
  }
}

export async function createProjectAction(formData: FormData) {
  try {
    const redirectTo = optionalString(formData, "redirectTo");
    const id = `project-${crypto.randomUUID()}`;
    const stage = requiredString(formData, "stage");
    const safeStage = stages.includes(stage as (typeof stages)[number]) ? stage : "Lead Found";
    const paymentFields = getPaymentFields(formData);
    const pageItems = getProjectPageItems(formData);
    const supabase = await getActionSupabaseClient();
    const payload = {
      id,
      client_id: requiredString(formData, "clientId"),
      name: requiredString(formData, "name"),
      stage: safeStage,
      attention_priority: optionalString(formData, "attentionPriority") || "Normal",
      follow_up_date: optionalString(formData, "followUpDate") || null,
      working_url: optionalString(formData, "workingUrl"),
      live_url: optionalString(formData, "liveUrl"),
      next_action: optionalString(formData, "nextAction"),
      contract_amount: parseCurrencyInput(optionalString(formData, "contractAmount")),
      ...paymentFields,
      homepage_status: optionalString(formData, "homepageStatus") || "Not started",
      homepage_notes: optionalString(formData, "homepageNotes"),
      overview: optionalString(formData, "overview"),
      waiting_on: optionalString(formData, "waitingOn"),
    };
    await insertWithColumnCompatibility("projects", payload, {
      requiredColumns: [
        "payment_structure",
        "installment_count",
        "hosting_enabled",
        "hosting_amount",
      ],
    });
    if (pageItems.length > 0) {
      const { error: pageError } = await supabase.from("project_pages").insert(
        pageItems.map((page) => ({
          ...page,
          project_id: id,
        })),
      );
      throwIfSupabaseError(pageError);
    }
    revalidateProjectSurface();
    await redirectWithFeedback({
      fallbackPath: "/projects",
      message: "Project added.",
      path: redirectTo || undefined,
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    const redirectTo = optionalString(formData, "redirectTo");
    await redirectWithFeedback({
      fallbackPath: "/projects",
      message: "Could not add project.",
      path: redirectTo || undefined,
      type: "error",
    });
  }
}

export async function updateProjectAction(formData: FormData) {
  try {
    const id = requiredString(formData, "id");
    const stage = requiredString(formData, "stage");
    const safeStage = stages.includes(stage as (typeof stages)[number]) ? stage : "Lead Found";
    const paymentFields = getPaymentFields(formData);
    const payload = {
      name: requiredString(formData, "name"),
      stage: safeStage,
      attention_priority: optionalString(formData, "attentionPriority") || "Normal",
      follow_up_date: optionalString(formData, "followUpDate") || null,
      working_url: optionalString(formData, "workingUrl"),
      live_url: optionalString(formData, "liveUrl"),
      next_action: optionalString(formData, "nextAction"),
      contract_amount: parseCurrencyInput(optionalString(formData, "contractAmount")),
      ...paymentFields,
      homepage_status: optionalString(formData, "homepageStatus"),
      homepage_notes: optionalString(formData, "homepageNotes"),
      overview: optionalString(formData, "overview"),
      waiting_on: optionalString(formData, "waitingOn"),
    };
    await updateWithColumnCompatibility("projects", payload, { id }, {
      requiredColumns: [
        "payment_structure",
        "installment_count",
        "hosting_enabled",
        "hosting_amount",
      ],
    });
    revalidateProjectSurface(id);
    await redirectWithFeedback({ fallbackPath: `/projects/${id}`, message: "Project updated." });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({ fallbackPath: "/projects", message: "Could not update project.", type: "error" });
  }
}

export async function archiveProjectAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const { error } = await supabase.from("projects").update({ stage: "Complete" }).eq("id", id);
    throwIfSupabaseError(error);
    revalidateProjectSurface(id);
    await redirectWithFeedback({ fallbackPath: `/projects/${id}`, message: "Project archived." });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({ fallbackPath: "/projects", message: "Could not archive project.", type: "error" });
  }
}

export async function deleteProjectAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const { data, error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .select("id");
    throwIfSupabaseError(error);
    if (!data || data.length === 0) {
      throw new Error("Project delete was blocked or the record was not found.");
    }
    revalidateProjectSurface(id);
    await redirectWithFeedback({
      fallbackPath: "/projects",
      message: "Project deleted.",
      path: "/",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/projects",
      message:
        error instanceof Error ? error.message : "Could not delete project.",
      type: "error",
    });
  }
}

export async function createProjectPageAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const projectId = requiredString(formData, "projectId");
    const currentCount = Number(optionalString(formData, "currentCount")) || 0;
    const status = requiredString(formData, "status") as ProjectPageItem["status"];
    const payload = {
      id: `page-${crypto.randomUUID()}`,
      project_id: projectId,
      title: requiredString(formData, "title"),
      status,
      notes: optionalString(formData, "notes"),
      issues: optionalString(formData, "issues"),
      sort_order: currentCount + 1,
    };
    const { error } = await supabase.from("project_pages").insert(payload);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId);
    await redirectWithFeedback({ fallbackPath: `/projects/${projectId}`, message: "Page item added." });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({ fallbackPath: "/projects", message: "Could not add page item.", type: "error" });
  }
}

export async function updateProjectPageAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const projectId = requiredString(formData, "projectId");
    const status = requiredString(formData, "status") as ProjectPageItem["status"];
    const payload = {
      title: requiredString(formData, "title"),
      status,
      notes: optionalString(formData, "notes"),
      issues: optionalString(formData, "issues"),
    };
    const { error } = await supabase.from("project_pages").update(payload).eq("id", id);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId);
    await redirectWithFeedback({ fallbackPath: `/projects/${projectId}`, message: "Page item updated." });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({ fallbackPath: "/projects", message: "Could not update page item.", type: "error" });
  }
}

export async function updateProjectPageStatusAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const projectId = requiredString(formData, "projectId");
    const status = requiredString(formData, "status") as ProjectPageItem["status"];
    const { error } = await supabase
      .from("project_pages")
      .update({ status })
      .eq("id", id)
      .eq("project_id", projectId);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId);
    await redirectWithFeedback({
      fallbackPath: `/projects/${projectId}`,
      message: "Page status updated.",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/projects",
      message: "Could not update page status.",
      type: "error",
    });
  }
}

export async function deleteProjectPageAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const projectId = requiredString(formData, "projectId");
    const { error } = await supabase.from("project_pages").delete().eq("id", id).eq("project_id", projectId);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId);
    await redirectWithFeedback({ fallbackPath: `/projects/${projectId}`, message: "Page item deleted." });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({ fallbackPath: "/projects", message: "Could not delete page item.", type: "error" });
  }
}

export async function createCredentialAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const projectId = requiredString(formData, "projectId");
    const payload = {
      project_id: projectId,
      label: requiredString(formData, "label"),
      username: encryptCredentialValue(optionalString(formData, "username")),
      password_value: encryptCredentialValue(optionalString(formData, "password")),
      url: optionalString(formData, "url"),
      notes: optionalString(formData, "notes"),
    };
    const { error } = await supabase.from("project_credentials").insert(payload);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId);
    await redirectWithFeedback({ fallbackPath: `/projects/${projectId}`, message: "Credential added." });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({ fallbackPath: "/projects", message: "Could not add credential.", type: "error" });
  }
}

export async function updateCredentialAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const projectId = requiredString(formData, "projectId");
    const id = requiredString(formData, "id");
    const payload = {
      label: requiredString(formData, "label"),
      username: encryptCredentialValue(optionalString(formData, "username")),
      password_value: encryptCredentialValue(optionalString(formData, "password")),
      url: optionalString(formData, "url"),
      notes: optionalString(formData, "notes"),
    };
    const { error } = await supabase.from("project_credentials").update(payload).eq("id", id).eq("project_id", projectId);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId);
    await redirectWithFeedback({ fallbackPath: `/projects/${projectId}`, message: "Credential updated." });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({ fallbackPath: "/projects", message: "Could not update credential.", type: "error" });
  }
}

export async function deleteCredentialAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const projectId = requiredString(formData, "projectId");
    const { error } = await supabase.from("project_credentials").delete().eq("id", id).eq("project_id", projectId);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId);
    await redirectWithFeedback({ fallbackPath: `/projects/${projectId}`, message: "Credential deleted." });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({ fallbackPath: "/projects", message: "Could not delete credential.", type: "error" });
  }
}

export async function createAccountCredentialAction(formData: FormData) {
  try {
    const user = await getAuthenticatedActionUser();

    if (!user) {
      throw new Error("You must be signed in to save passwords here.");
    }

    const supabase = await getActionSupabaseClient();
    const payload = {
      id: `account-credential-${crypto.randomUUID()}`,
      user_id: user.id,
      label: requiredString(formData, "label"),
      username: encryptCredentialValue(optionalString(formData, "username")),
      password_value: encryptCredentialValue(optionalString(formData, "password")),
      url: optionalString(formData, "url"),
      notes: optionalString(formData, "notes"),
    };
    const { error } = await supabase.from("account_credentials").insert(payload);
    throwIfSupabaseError(error);
    revalidatePath("/account");
    await redirectWithFeedback({
      fallbackPath: "/account",
      message: "Stored password added.",
      path: "/account",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/account",
      message:
        error instanceof Error ? error.message : "Could not add stored password.",
      path: "/account",
      type: "error",
    });
  }
}

export async function updateAccountCredentialAction(formData: FormData) {
  try {
    const user = await getAuthenticatedActionUser();

    if (!user) {
      throw new Error("You must be signed in to update passwords here.");
    }

    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const payload = {
      label: requiredString(formData, "label"),
      username: encryptCredentialValue(optionalString(formData, "username")),
      password_value: encryptCredentialValue(optionalString(formData, "password")),
      url: optionalString(formData, "url"),
      notes: optionalString(formData, "notes"),
    };
    const { error } = await supabase
      .from("account_credentials")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);
    throwIfSupabaseError(error);
    revalidatePath("/account");
    await redirectWithFeedback({
      fallbackPath: "/account",
      message: "Stored password updated.",
      path: "/account",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/account",
      message:
        error instanceof Error ? error.message : "Could not update stored password.",
      path: "/account",
      type: "error",
    });
  }
}

export async function deleteAccountCredentialAction(formData: FormData) {
  try {
    const user = await getAuthenticatedActionUser();

    if (!user) {
      throw new Error("You must be signed in to delete passwords here.");
    }

    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const { error } = await supabase
      .from("account_credentials")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    throwIfSupabaseError(error);
    revalidatePath("/account");
    await redirectWithFeedback({
      fallbackPath: "/account",
      message: "Stored password deleted.",
      path: "/account",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/account",
      message:
        error instanceof Error ? error.message : "Could not delete stored password.",
      path: "/account",
      type: "error",
    });
  }
}

export async function createInvoiceAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const projectId = requiredString(formData, "projectId");
    const lineItems = getInvoiceLineItems(formData);
    const statusInput = requiredString(formData, "status");
    const status = invoiceStatuses.includes(
      statusInput as (typeof invoiceStatuses)[number],
    )
      ? statusInput
      : "Draft";
    const derivedAmount =
      lineItems.length > 0
        ? lineItems.reduce(
            (sum, item) => sum + item.quantity * item.unit_price,
            0,
          )
        : parseCurrencyInput(optionalString(formData, "amount"));
    const invoiceId = `invoice-${crypto.randomUUID()}`;
    const payload = {
      id: invoiceId,
      project_id: projectId,
      invoice_number: requiredString(formData, "invoiceNumber"),
      title: requiredString(formData, "title"),
      amount: derivedAmount,
      status,
      sent_date: optionalString(formData, "sentDate") || null,
      due_date: optionalString(formData, "dueDate") || null,
      paid_date: optionalString(formData, "paidDate") || null,
      notes: optionalString(formData, "notes"),
    };
    const { error } = await supabase.from("project_invoices").insert(payload);
    throwIfSupabaseError(error);
    if (lineItems.length > 0) {
      const { error: itemError } = await supabase.from("project_invoice_items").insert(
        lineItems.map((item) => ({
          ...item,
          invoice_id: invoiceId,
        })),
      );
      throwIfSupabaseError(itemError);
    }
    revalidateProjectSurface(projectId);
    revalidatePath("/finance");
    await redirectWithFeedback({
      fallbackPath: `/projects/${projectId}`,
      message: "Invoice created.",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/projects",
      message: "Could not create invoice.",
      type: "error",
    });
  }
}

export async function updateInvoiceAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const projectId = requiredString(formData, "projectId");
    const id = requiredString(formData, "id");
    const lineItems = getInvoiceLineItems(formData);
    const statusInput = requiredString(formData, "status");
    const status = invoiceStatuses.includes(
      statusInput as (typeof invoiceStatuses)[number],
    )
      ? statusInput
      : "Draft";
    const derivedAmount =
      lineItems.length > 0
        ? lineItems.reduce(
            (sum, item) => sum + item.quantity * item.unit_price,
            0,
          )
        : parseCurrencyInput(optionalString(formData, "amount"));
    const payload = {
      invoice_number: requiredString(formData, "invoiceNumber"),
      title: requiredString(formData, "title"),
      amount: derivedAmount,
      status,
      sent_date: optionalString(formData, "sentDate") || null,
      due_date: optionalString(formData, "dueDate") || null,
      paid_date: optionalString(formData, "paidDate") || null,
      notes: optionalString(formData, "notes"),
    };
    const { error } = await supabase
      .from("project_invoices")
      .update(payload)
      .eq("id", id)
      .eq("project_id", projectId);
    throwIfSupabaseError(error);
    const { error: deleteItemsError } = await supabase
      .from("project_invoice_items")
      .delete()
      .eq("invoice_id", id);
    throwIfSupabaseError(deleteItemsError);
    if (lineItems.length > 0) {
      const { error: itemError } = await supabase.from("project_invoice_items").insert(
        lineItems.map((item) => ({
          ...item,
          invoice_id: id,
        })),
      );
      throwIfSupabaseError(itemError);
    }
    revalidateProjectSurface(projectId);
    revalidatePath("/finance");
    await redirectWithFeedback({
      fallbackPath: `/projects/${projectId}`,
      message: "Invoice updated.",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/projects",
      message: "Could not update invoice.",
      type: "error",
    });
  }
}

export async function deleteInvoiceAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const projectId = requiredString(formData, "projectId");
    const { error } = await supabase
      .from("project_invoices")
      .delete()
      .eq("id", id)
      .eq("project_id", projectId);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId);
    revalidatePath("/finance");
    await redirectWithFeedback({
      fallbackPath: `/projects/${projectId}`,
      message: "Invoice deleted.",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/projects",
      message: "Could not delete invoice.",
      type: "error",
    });
  }
}

export async function markInvoiceSentAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const projectId = requiredString(formData, "projectId");
    const id = requiredString(formData, "id");
    const currentStatus = requiredString(formData, "currentStatus");
    const currentSentDate = optionalString(formData, "currentSentDate");
    const today = new Date().toISOString().slice(0, 10);
    const payload = {
      status:
        currentStatus === "Draft"
          ? "Sent"
          : currentStatus === "Cancelled"
            ? "Cancelled"
            : currentStatus === "Paid"
              ? "Paid"
              : currentStatus === "Overdue"
                ? "Overdue"
                : "Sent",
      sent_date: currentSentDate || today,
    };
    const { error } = await supabase
      .from("project_invoices")
      .update(payload)
      .eq("id", id)
      .eq("project_id", projectId);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId);
    revalidatePath("/finance");
    revalidatePath(`/invoices/${projectId}/${id}`);
    await redirectWithFeedback({
      fallbackPath: `/projects/${projectId}`,
      message: "Invoice marked as sent.",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/projects",
      message: "Could not mark invoice as sent.",
      type: "error",
    });
  }
}

export async function enableInvoiceShareAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const projectId = requiredString(formData, "projectId");
    const id = requiredString(formData, "id");
    const currentShareToken = optionalString(formData, "currentShareToken");
    const shareToken = currentShareToken || crypto.randomUUID();
    const { error } = await supabase
      .from("project_invoices")
      .update({
        share_enabled: true,
        share_token: shareToken,
      })
      .eq("id", id)
      .eq("project_id", projectId);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId);
    revalidatePath("/finance");
    await redirectWithFeedback({
      fallbackPath: `/projects/${projectId}`,
      message: "Share link enabled.",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/projects",
      message: "Could not enable share link.",
      type: "error",
    });
  }
}

export async function disableInvoiceShareAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const projectId = requiredString(formData, "projectId");
    const id = requiredString(formData, "id");
    const { error } = await supabase
      .from("project_invoices")
      .update({
        share_enabled: false,
      })
      .eq("id", id)
      .eq("project_id", projectId);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId);
    revalidatePath("/finance");
    await redirectWithFeedback({
      fallbackPath: `/projects/${projectId}`,
      message: "Share link disabled.",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/projects",
      message: "Could not disable share link.",
      type: "error",
    });
  }
}

export async function regenerateInvoiceShareAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const projectId = requiredString(formData, "projectId");
    const id = requiredString(formData, "id");
    const { error } = await supabase
      .from("project_invoices")
      .update({
        share_enabled: true,
        share_token: crypto.randomUUID(),
      })
      .eq("id", id)
      .eq("project_id", projectId);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId);
    revalidatePath("/finance");
    await redirectWithFeedback({
      fallbackPath: `/projects/${projectId}`,
      message: "Share link regenerated.",
    });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({
      fallbackPath: "/projects",
      message: "Could not regenerate share link.",
      type: "error",
    });
  }
}

export async function createFinanceEntryAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const projectId = requiredString(formData, "projectId");
    const dueDate = optionalString(formData, "dueDate");
    const payload = {
      id: `finance-${crypto.randomUUID()}`,
      project_id: projectId,
      invoice_id: optionalString(formData, "invoiceId") || null,
      entry_date: requiredString(formData, "entryDate"),
      due_date: dueDate || null,
      kind: requiredString(formData, "kind"),
      amount: parseCurrencyInput(optionalString(formData, "amount")),
      note: optionalString(formData, "note"),
    };
    const { error } = await supabase.from("project_finance_entries").insert(payload);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId);
    revalidatePath("/finance");
    await redirectWithFeedback({ fallbackPath: `/projects/${projectId}`, message: "Finance entry added." });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({ fallbackPath: "/projects", message: "Could not add finance entry.", type: "error" });
  }
}

export async function updateFinanceEntryAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const projectId = requiredString(formData, "projectId");
    const id = requiredString(formData, "id");
    const dueDate = optionalString(formData, "dueDate");
    const payload = {
      invoice_id: optionalString(formData, "invoiceId") || null,
      entry_date: requiredString(formData, "entryDate"),
      due_date: dueDate || null,
      kind: requiredString(formData, "kind"),
      amount: parseCurrencyInput(optionalString(formData, "amount")),
      note: optionalString(formData, "note"),
    };
    const { error } = await supabase
      .from("project_finance_entries")
      .update(payload)
      .eq("id", id)
      .eq("project_id", projectId);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId);
    revalidatePath("/finance");
    await redirectWithFeedback({ fallbackPath: `/projects/${projectId}`, message: "Finance entry updated." });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({ fallbackPath: "/projects", message: "Could not update finance entry.", type: "error" });
  }
}

export async function deleteFinanceEntryAction(formData: FormData) {
  try {
    const supabase = await getActionSupabaseClient();
    const id = requiredString(formData, "id");
    const projectId = requiredString(formData, "projectId");
    const { error } = await supabase
      .from("project_finance_entries")
      .delete()
      .eq("id", id)
      .eq("project_id", projectId);
    throwIfSupabaseError(error);
    revalidateProjectSurface(projectId);
    revalidatePath("/finance");
    await redirectWithFeedback({ fallbackPath: `/projects/${projectId}`, message: "Finance entry deleted." });
  } catch (error) {
    rethrowIfRedirectError(error);
    await redirectWithFeedback({ fallbackPath: "/projects", message: "Could not delete finance entry.", type: "error" });
  }
}
