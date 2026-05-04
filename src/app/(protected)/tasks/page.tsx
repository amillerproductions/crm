import TasksPageView from "@/views/tasks-page";

type ProtectedTasksPageProps = {
  searchParams?: Promise<{
    message?: string;
    q?: string;
    type?: string;
  }>;
};

export default function ProtectedTasksPage({
  searchParams,
}: ProtectedTasksPageProps) {
  return <TasksPageView searchParams={searchParams} />;
}
