import ClientsPageView from "@/views/clients-page";

type ProtectedClientsPageProps = {
  searchParams?: Promise<{
    message?: string;
    type?: string;
  }>;
};

export default function ProtectedClientsPage({
  searchParams,
}: ProtectedClientsPageProps) {
  return <ClientsPageView searchParams={searchParams} />;
}
