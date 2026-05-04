import ProspectsPageView from "@/views/prospects-page";

type ProtectedProspectsPageProps = {
  searchParams?: Promise<{
    message?: string;
    q?: string;
    sort?: string;
    type?: string;
  }>;
};

export default function ProtectedProspectsPage({
  searchParams,
}: ProtectedProspectsPageProps) {
  return <ProspectsPageView searchParams={searchParams} />;
}
