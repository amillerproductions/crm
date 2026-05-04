import ProjectDetailPageView from "@/views/project-detail-page";

type ProtectedProjectDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    message?: string;
    type?: string;
  }>;
};

export default function ProtectedProjectDetailPage({
  params,
  searchParams,
}: ProtectedProjectDetailPageProps) {
  return <ProjectDetailPageView params={params} searchParams={searchParams} />;
}
