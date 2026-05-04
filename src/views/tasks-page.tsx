import Link from "next/link";
import {
  createSuggestedTaskAction,
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
  updateTaskStatusAction,
} from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FlashBanner } from "@/components/flash-banner";
import { SubmitButton } from "@/components/submit-button";
import { getClients, getProjects, getProspects, getSuggestedTasks, getTasks } from "@/lib/crm-data";
import { getFeedbackFromSearchParams } from "@/lib/feedback";

const taskStatuses = ["To do", "In progress", "Waiting", "Done"] as const;
const taskPriorities = ["Low", "Normal", "High", "Urgent"] as const;

function formatDueDate(value: string) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function getTaskStatusClasses(status: string) {
  switch (status) {
    case "Done":
      return "border-[rgba(84,170,126,0.28)] bg-[rgba(84,170,126,0.14)] text-[rgba(225,255,236,0.96)]";
    case "In progress":
      return "border-[var(--color-accent)]/22 bg-[var(--color-accent)]/10 text-[var(--color-soft)]";
    case "Waiting":
      return "border-[rgba(224,150,63,0.34)] bg-[rgba(224,150,63,0.14)] text-[rgba(255,238,210,0.96)]";
    default:
      return "border-white/10 bg-white/6 text-slate-100/78";
  }
}

function getTaskPriorityClasses(priority: string) {
  switch (priority) {
    case "Urgent":
      return "border-[rgba(210,98,58,0.38)] bg-[rgba(210,98,58,0.14)] text-[rgba(255,228,214,0.96)]";
    case "High":
      return "border-[rgba(224,150,63,0.34)] bg-[rgba(224,150,63,0.14)] text-[rgba(255,238,210,0.96)]";
    case "Low":
      return "border-white/10 bg-white/6 text-slate-100/72";
    default:
      return "border-[rgba(136,190,219,0.24)] bg-[rgba(136,190,219,0.1)] text-[var(--color-soft)]";
  }
}

function getTaskMoveButtonClasses(isActive: boolean, status: string) {
  if (isActive) {
    return `border ${getTaskStatusClasses(status)}`;
  }

  return "border border-white/10 bg-black/10 text-slate-300/72 transition hover:border-white/18 hover:text-slate-100/90";
}

type TasksPageProps = {
  searchParams?: Promise<{
    message?: string;
    q?: string;
    type?: string;
  }>;
};

export default async function TasksPageView({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const feedback = getFeedbackFromSearchParams(params);
  const query = params?.q?.trim() ?? "";
  const normalizedQuery = query.toLowerCase();
  const [tasks, suggestedTasks, projects, clients, prospects] = await Promise.all([
    getTasks(),
    getSuggestedTasks(),
    getProjects(),
    getClients(),
    getProspects(),
  ]);

  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const clientMap = new Map(clients.map((client) => [client.id, client]));
  const prospectMap = new Map(prospects.map((prospect) => [prospect.id, prospect]));
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;

  const tasksWithContext = tasks
    .map((task) => {
      const project = task.projectId ? projectMap.get(task.projectId) : undefined;
      const client = task.clientId ? clientMap.get(task.clientId) : undefined;
      const prospect = task.prospectId ? prospectMap.get(task.prospectId) : undefined;
      const relatedLabel =
        project?.name ?? client?.company ?? prospect?.company ?? "General task";

      return {
        ...task,
        client,
        project,
        prospect,
        relatedLabel,
      };
    })
    .filter((task) =>
      normalizedQuery
        ? [
            task.title,
            task.details,
            task.status,
            task.priority,
            task.relatedLabel,
            task.project?.name ?? "",
            task.client?.company ?? "",
            task.prospect?.company ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        : true,
    )
    .sort((left, right) => {
      if (left.status === "Done" && right.status !== "Done") return 1;
      if (left.status !== "Done" && right.status === "Done") return -1;
      return (left.dueDate || "9999-12-31").localeCompare(
        right.dueDate || "9999-12-31",
      );
    });
  const tasksByStatus = taskStatuses.map((status) => ({
    status,
    tasks: tasksWithContext.filter((task) => task.status === status),
  }));

  const overdueCount = tasksWithContext.filter(
    (task) => task.status !== "Done" && task.dueDate && task.dueDate < todayKey,
  ).length;
  const dueTodayCount = tasksWithContext.filter(
    (task) => task.status !== "Done" && task.dueDate === todayKey,
  ).length;
  const openCount = tasksWithContext.filter((task) => task.status !== "Done").length;

  return (
    <div className="space-y-8">
      <FlashBanner message={feedback.message} type={feedback.type} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-eyebrow">Tasks</p>
          <h1 className="section-title">Reminders and next actions in one place</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/76">
            Track what needs doing, what is waiting on someone else, and what is due soon across projects, clients, and prospects.
          </p>
        </div>
        <Link className="btn-secondary" href="/">
          Open dashboard
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Open tasks",
            value: String(openCount),
            detail: "Everything not marked done yet.",
          },
          {
            label: "Due today",
            value: String(dueTodayCount),
            detail: "Tasks that should get attention before the day ends.",
          },
          {
            label: "Overdue",
            value: String(overdueCount),
            detail: "Tasks that have slipped past their target date.",
          },
          {
            label: "Suggested reminders",
            value: String(suggestedTasks.length),
            detail: "Auto-prompts from invoices, follow-ups, and stale work.",
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-[1.35rem] border border-white/8 bg-[var(--color-panel-strong)]/62 p-5"
          >
            <p className="label">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-soft)]">
              {item.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300/72">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="space-y-6">
        <section className="panel">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <details className="rounded-[1.25rem] border border-white/8 bg-[var(--color-panel-strong)]/45 px-4 py-4 xl:min-w-[23rem]">
              <summary className="cursor-pointer list-none">
                <span className="btn-primary inline-flex">New task</span>
              </summary>
              <div className="mt-5">
                <p className="section-eyebrow">New task</p>
                <h2 className="section-title">Add a reminder or to-do</h2>
              </div>

              <form action={createTaskAction} className="mt-6 space-y-4">
                <div>
                  <p className="label">Title</p>
                  <input className="field mt-2" name="title" minLength={2} required />
                </div>
                <div>
                  <p className="label">Details</p>
                  <textarea className="field-area mt-2" name="details" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="label">Due date</p>
                    <input className="field mt-2" name="dueDate" type="date" />
                  </div>
                  <div>
                    <p className="label">Status</p>
                    <select className="field-select mt-2" name="status" defaultValue="To do">
                      {taskStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="label">Priority</p>
                    <select className="field-select mt-2" name="priority" defaultValue="Normal">
                      {taskPriorities.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="label">Project</p>
                    <select className="field-select mt-2" name="projectId" defaultValue="">
                      <option value="">No linked project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.clientName} · {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="label">Client</p>
                    <select className="field-select mt-2" name="clientId" defaultValue="">
                      <option value="">No linked client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.company}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="label">Prospect</p>
                    <select className="field-select mt-2" name="prospectId" defaultValue="">
                      <option value="">No linked prospect</option>
                      {prospects.map((prospect) => (
                        <option key={prospect.id} value={prospect.id}>
                          {prospect.company}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <SubmitButton className="btn-primary" pendingText="Adding task...">
                  Add task
                </SubmitButton>
              </form>
            </details>

            <form className="space-y-3" method="get">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                <div>
                  <p className="label">Search tasks</p>
                  <input
                    className="field mt-2"
                    defaultValue={query}
                    name="q"
                    placeholder="Search by task, priority, status, project, client, or prospect"
                  />
                </div>
                <div className="flex flex-wrap gap-3 xl:justify-end">
                  <button className="btn-secondary" type="submit">
                    Apply
                  </button>
                  {query ? (
                    <Link className="btn-secondary" href="/tasks">
                      Clear
                    </Link>
                  ) : null}
                </div>
              </div>
            </form>
          </div>
        </section>

        <section className="panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="section-eyebrow">Suggested reminders</p>
              <h2 className="section-title">Signals the CRM thinks deserve attention</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-100/80">
              {suggestedTasks.length} suggested
            </span>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {suggestedTasks.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-white/10 px-5 py-6 text-sm text-slate-300/72 xl:col-span-2">
                Nothing urgent is being suggested right now. The board only surfaces reminders when something actually looks ready for follow-up.
              </div>
            ) : (
              suggestedTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-[1.35rem] border border-white/8 bg-[var(--color-panel-strong)]/55 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                        {task.reason === "invoice-overdue"
                          ? "Overdue invoice"
                          : task.reason === "project-follow-up"
                            ? "Project follow-up"
                            : task.reason === "project-stale"
                              ? "Stale project"
                              : "Prospect follow-up"}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[var(--color-soft)]">
                        {task.title}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${getTaskPriorityClasses(
                        task.priority,
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="label">Due</p>
                      <p className="mt-1 text-sm text-slate-100/90">
                        {formatDueDate(task.dueDate)}
                      </p>
                    </div>
                    <div>
                      <p className="label">Status if created</p>
                      <p className="mt-1 text-sm text-slate-100/90">To do</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-300/76">{task.details}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {task.projectId ? (
                      <Link className="btn-secondary" href={`/projects/${task.projectId}`}>
                        Open project
                      </Link>
                    ) : null}
                    {task.clientId ? (
                      <Link className="btn-secondary" href={`/clients/${task.clientId}`}>
                        Open client
                      </Link>
                    ) : null}
                    {task.prospectId ? (
                      <Link className="btn-secondary" href="/prospects">
                        Open prospects
                      </Link>
                    ) : null}
                  </div>

                  <form action={createSuggestedTaskAction} className="mt-4">
                    <input type="hidden" name="title" value={task.title} />
                    <input type="hidden" name="details" value={task.details} />
                    <input type="hidden" name="dueDate" value={task.dueDate} />
                    <input type="hidden" name="priority" value={task.priority} />
                    <input type="hidden" name="projectId" value={task.projectId} />
                    <input type="hidden" name="clientId" value={task.clientId} />
                    <input type="hidden" name="prospectId" value={task.prospectId} />
                    <input type="hidden" name="redirectTo" value="/tasks" />
                    <SubmitButton className="btn-primary" pendingText="Adding task...">
                      Create task from reminder
                    </SubmitButton>
                  </form>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-eyebrow">Board</p>
              <h2 className="section-title">Move work across the week</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-100/80">
              {tasksWithContext.length} tracked
            </span>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-4">
            {tasksByStatus.map((column) => (
              <div
                key={column.status}
                className="rounded-[1.35rem] border border-white/8 bg-[var(--color-panel-strong)]/45 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
                      {column.status}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-[var(--color-soft)]">
                      {column.tasks.length} task{column.tasks.length === 1 ? "" : "s"}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${getTaskStatusClasses(
                      column.status,
                    )}`}
                  >
                    {column.status}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {column.tasks.length === 0 ? (
                    <div className="rounded-[1rem] border border-dashed border-white/10 px-4 py-5 text-sm text-slate-300/62">
                      Nothing sitting here right now.
                    </div>
                  ) : (
                    column.tasks.map((task) => (
                      <article
                        key={task.id}
                        className="rounded-[1.2rem] border border-white/8 bg-[rgba(8,19,27,0.62)] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
                              {task.relatedLabel}
                            </p>
                            <h4 className="mt-2 text-base font-semibold text-[var(--color-soft)]">
                              {task.title}
                            </h4>
                          </div>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${getTaskPriorityClasses(
                              task.priority,
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="label">Due</p>
                            <p className="mt-1 text-sm text-slate-100/90">
                              {formatDueDate(task.dueDate)}
                            </p>
                          </div>
                          <div>
                            <p className="label">Linked to</p>
                            <p className="mt-1 text-sm text-slate-100/90">
                              {task.client?.company || task.prospect?.company || task.project?.name || "General"}
                            </p>
                          </div>
                        </div>

                        {task.details ? (
                          <p className="mt-4 text-sm leading-6 text-slate-300/76">
                            {task.details}
                          </p>
                        ) : null}

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {taskStatuses.map((status) => (
                            <form key={`${task.id}-${status}`} action={updateTaskStatusAction}>
                              <input type="hidden" name="id" value={task.id} />
                              <input type="hidden" name="status" value={status} />
                              <SubmitButton
                                className={`w-full rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.16em] ${getTaskMoveButtonClasses(
                                  task.status === status,
                                  status,
                                )}`}
                                pendingText="Moving..."
                              >
                                {status}
                              </SubmitButton>
                            </form>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {task.project ? (
                            <Link className="btn-secondary" href={`/projects/${task.project.id}`}>
                              Project
                            </Link>
                          ) : null}
                          {task.client ? (
                            <Link className="btn-secondary" href={`/clients/${task.client.id}`}>
                              Client
                            </Link>
                          ) : null}
                          {task.prospect ? (
                            <Link className="btn-secondary" href="/prospects">
                              Prospect
                            </Link>
                          ) : null}
                        </div>

                        <details className="mt-4">
                          <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
                            Edit task
                          </summary>
                          <form action={updateTaskAction} className="mt-4 space-y-4 rounded-[1rem] border border-white/8 bg-black/10 p-4">
                            <input type="hidden" name="id" value={task.id} />
                            <div>
                              <p className="label">Title</p>
                              <input className="field mt-2" name="title" defaultValue={task.title} minLength={2} required />
                            </div>
                            <div>
                              <p className="label">Details</p>
                              <textarea className="field-area mt-2" name="details" defaultValue={task.details} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <p className="label">Due date</p>
                                <input className="field mt-2" name="dueDate" type="date" defaultValue={task.dueDate} />
                              </div>
                              <div>
                                <p className="label">Status</p>
                                <select className="field-select mt-2" name="status" defaultValue={task.status}>
                                  {taskStatuses.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <p className="label">Priority</p>
                                <select className="field-select mt-2" name="priority" defaultValue={task.priority}>
                                  {taskPriorities.map((priority) => (
                                    <option key={priority} value={priority}>
                                      {priority}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <p className="label">Project</p>
                                <select className="field-select mt-2" name="projectId" defaultValue={task.projectId}>
                                  <option value="">No linked project</option>
                                  {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                      {project.clientName} · {project.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <p className="label">Client</p>
                                <select className="field-select mt-2" name="clientId" defaultValue={task.clientId}>
                                  <option value="">No linked client</option>
                                  {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                      {client.company}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <p className="label">Prospect</p>
                                <select className="field-select mt-2" name="prospectId" defaultValue={task.prospectId}>
                                  <option value="">No linked prospect</option>
                                  {prospects.map((prospect) => (
                                    <option key={prospect.id} value={prospect.id}>
                                      {prospect.company}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <SubmitButton className="btn-secondary" pendingText="Updating task...">
                              Update task
                            </SubmitButton>
                          </form>
                          <form action={deleteTaskAction} className="mt-4">
                            <input type="hidden" name="id" value={task.id} />
                            <ConfirmSubmitButton
                              className="text-xs uppercase tracking-[0.18em] text-[rgba(255,228,214,0.9)] transition hover:text-[rgba(255,200,180,0.98)]"
                              confirmMessage="Delete this task?"
                              pendingText="Deleting..."
                            >
                              Delete task
                            </ConfirmSubmitButton>
                          </form>
                        </details>
                      </article>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          {tasksWithContext.length === 0 ? (
            <div className="panel">
              <p className="section-eyebrow">No matches</p>
              <h2 className="section-title">No tasks matched that search</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300/76">
                Try a different keyword or clear the search to bring the full task list back.
              </p>
            </div>
          ) : (
            <div className="panel">
              <p className="section-eyebrow">Filtered board</p>
              <h2 className="section-title">Results are already shown in the board above</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300/76">
                Use the status columns above to move work, and use search when you want to narrow the board down to a specific client, project, or reminder.
              </p>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
