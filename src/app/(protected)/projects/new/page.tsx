import NewProjectPageView from "@/views/new-project-page";

type ProtectedNewProjectPageProps = {
  searchParams?: Promise<{
    clientId?: string;
    message?: string;
    type?: string;
  }>;
};

export default function ProtectedNewProjectPage({
  searchParams,
}: ProtectedNewProjectPageProps) {
  return <NewProjectPageView searchParams={searchParams} />;
}
