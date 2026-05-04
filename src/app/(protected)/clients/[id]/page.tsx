import ClientDetailPageView from "@/views/client-detail-page";

type ProtectedClientDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    message?: string;
    type?: string;
  }>;
};

export default function ProtectedClientDetailPage({
  params,
  searchParams,
}: ProtectedClientDetailPageProps) {
  return <ClientDetailPageView params={params} searchParams={searchParams} />;
}
