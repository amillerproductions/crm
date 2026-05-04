import ProjectsPageView from "@/views/projects-page";

type ProtectedProjectsPageProps = {
  searchParams?: Promise<{
    message?: string;
    type?: string;
  }>;
};

export default function ProtectedProjectsPage({
  searchParams,
}: ProtectedProjectsPageProps) {
  return <ProjectsPageView searchParams={searchParams} />;
}
