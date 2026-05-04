import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { getClientById, getProjectById } from "@/lib/crm-data";
import { InvoiceDocumentPage } from "@/views/invoice-document-page";

type InvoiceDocumentRouteProps = {
  params: Promise<{
    projectId: string;
    invoiceId: string;
  }>;
};

export default async function InvoiceDocumentRoute({
  params,
}: InvoiceDocumentRouteProps) {
  const user = await getAuthenticatedUser();

  if (!user?.email) {
    redirect("/login");
  }

  const { invoiceId, projectId } = await params;
  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  const invoice = project.invoices.find((item) => item.id === invoiceId);

  if (!invoice) {
    notFound();
  }

  const client = await getClientById(project.clientId);
  const issuedBy =
    String(user.user_metadata?.display_name ?? "").trim() || user.email;

  return (
    <InvoiceDocumentPage
      client={client}
      invoice={invoice}
      issuedBy={issuedBy}
      project={project}
    />
  );
}
