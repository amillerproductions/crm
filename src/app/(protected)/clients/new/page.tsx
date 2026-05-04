import NewClientPageView from "@/views/new-client-page";

type ProtectedNewClientPageProps = {
  searchParams?: Promise<{
    message?: string;
    type?: string;
  }>;
};

export default function ProtectedNewClientPage({
  searchParams,
}: ProtectedNewClientPageProps) {
  return <NewClientPageView searchParams={searchParams} />;
}
