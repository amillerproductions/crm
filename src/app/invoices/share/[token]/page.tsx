import { notFound } from "next/navigation";
import { getSharedInvoiceByToken } from "@/lib/crm-data";
import { InvoiceDocumentPage } from "@/views/invoice-document-page";

type SharedInvoiceRouteProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function SharedInvoiceRoute({
  params,
}: SharedInvoiceRouteProps) {
  const { token } = await params;
  const record = await getSharedInvoiceByToken(token);

  if (!record) {
    notFound();
  }

  return (
    <InvoiceDocumentPage
      client={record.client}
      invoice={record.invoice}
      issuedBy="KAGE Media"
      isPublic={true}
      project={record.project}
    />
  );
}
