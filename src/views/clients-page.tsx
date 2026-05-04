import Link from "next/link";
import { deleteClientAction, updateClientAction } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FlashBanner } from "@/components/flash-banner";
import { SubmitButton } from "@/components/submit-button";
import { getClients, getProjectsForClient } from "@/lib/crm-data";
import { getFeedbackFromSearchParams } from "@/lib/feedback";

type ClientsPageViewProps = {
  searchParams?: Promise<{
    message?: string;
    q?: string;
    sort?: string;
    type?: string;
  }>;
};

export default async function ClientsPageView({
  searchParams,
}: ClientsPageViewProps) {
  const params = await searchParams;
  const clients = await getClients();
  const feedback = getFeedbackFromSearchParams(params);
  const query = params?.q?.trim() ?? "";
  const sort = params?.sort?.trim() ?? "name-asc";
  const normalizedQuery = query.toLowerCase();
  const clientsWithProjects = await Promise.all(
    clients.map(async (client) => ({
      client,
      projects: await getProjectsForClient(client.id),
    })),
  );
  const filteredClients = normalizedQuery
    ? clientsWithProjects.filter(({ client, projects }) => {
        const haystack = [
          client.name,
          client.company,
          client.email,
          client.phone,
          client.notes,
          ...projects.map((project) => project.name),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
    : clientsWithProjects;
  const sortedClients = [...filteredClients].sort((left, right) => {
    const leftActiveValue = left.projects
      .filter((project) => project.stage !== "Complete")
      .reduce((sum, project) => sum + Number(project.contract.replace(/[$,]/g, "")), 0);
    const rightActiveValue = right.projects
      .filter((project) => project.stage !== "Complete")
      .reduce((sum, project) => sum + Number(project.contract.replace(/[$,]/g, "")), 0);

    switch (sort) {
      case "name-desc":
        return right.client.name.localeCompare(left.client.name);
      case "company-asc":
        return left.client.company.localeCompare(right.client.company);
      case "company-desc":
        return right.client.company.localeCompare(left.client.company);
      case "projects-desc":
        return right.projects.length - left.projects.length;
      case "value-desc":
        return rightActiveValue - leftActiveValue;
      default:
        return left.client.name.localeCompare(right.client.name);
    }
  });

  return (
    <div className="space-y-8">
      <FlashBanner message={feedback.message} type={feedback.type} />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-eyebrow">Clients</p>
          <h1 className="section-title">Contacts tied to real project work</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/76">
            This view is built for quick lookup: contact info, project
            connection, notes, and a clean path to adding new clients in the
            next iteration.
          </p>
        </div>
        <Link className="btn-primary" href="/clients/new">
          Add client
        </Link>
      </header>

      <section className="panel">
        <form className="space-y-3" method="get">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_16rem_auto] xl:items-end">
            <div className="min-w-0">
              <p className="label">Search clients</p>
              <input
                className="field mt-2"
                defaultValue={query}
                name="q"
                placeholder="Search by client, company, email, phone, notes, or project name"
              />
            </div>
            <div className="min-w-0">
              <p className="label">Sort</p>
              <select className="field-select mt-2" defaultValue={sort} name="sort">
                <option value="name-asc">Client name A-Z</option>
                <option value="name-desc">Client name Z-A</option>
                <option value="company-asc">Company A-Z</option>
                <option value="company-desc">Company Z-A</option>
                <option value="projects-desc">Most projects</option>
                <option value="value-desc">Highest open value</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-3 xl:justify-end">
              <button className="btn-secondary" type="submit">
                Apply
              </button>
              {query || sort !== "name-asc" ? (
                <Link className="btn-secondary" href="/clients">
                  Clear
                </Link>
              ) : null}
            </div>
          </div>
          <p className="field-hint">
            Try a company name, contact email, or one of their project names.
          </p>
        </form>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {sortedClients.length === 0 ? (
          <div className="panel lg:col-span-2">
            <p className="section-eyebrow">No matches</p>
            <h2 className="section-title">No clients matched that search</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300/76">
              Try a different client name, company, email, phone number, or
              clear the search to see the full list again.
            </p>
          </div>
        ) : (
          sortedClients.map(({ client, projects: clientProjects }) => (
            <article key={client.id} className="panel">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
                      {client.company}
                    </p>
                    <Link
                      href={`/clients/${client.id}`}
                      className="mt-2 inline-block text-2xl font-semibold text-[var(--color-soft)] transition hover:text-[var(--color-accent)]"
                    >
                      {client.name}
                    </Link>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300/72">
                      Open the client workspace to see relationship details,
                      tracked value, active builds, and completed work in one
                      place.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-100/80">
                    {clientProjects.length} projects
                  </span>
                </div>
                <div className="mt-6 grid gap-4 text-sm text-slate-300/84 sm:grid-cols-2">
                  <div>
                    <p className="label">Email</p>
                    <p className="mt-2 text-slate-100/90">{client.email}</p>
                  </div>
                  <div>
                    <p className="label">Phone</p>
                    <p className="mt-2 text-slate-100/90">{client.phone}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="label">Notes</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300/78">
                    {client.notes}
                  </p>
                </div>
                <div className="mt-6 rounded-[1.25rem] border border-white/8 bg-[var(--color-panel-strong)]/55 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="label">Linked projects</p>
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)] transition hover:text-[var(--color-soft)]"
                    >
                      Open client workspace
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {clientProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/12 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--color-soft)]/82 transition hover:bg-[var(--color-accent)]/22"
                      >
                        {project.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link className="btn-primary" href={`/clients/${client.id}`}>
                    Open client workspace
                  </Link>
                  {clientProjects[0] ? (
                    <Link className="btn-secondary" href={`/projects/${clientProjects[0].id}`}>
                      Jump to latest project
                    </Link>
                  ) : null}
                </div>
                <details className="mt-6">
                  <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
                    Edit client
                  </summary>
                  <form action={updateClientAction} className="mt-4 space-y-4 rounded-[1.25rem] border border-white/8 bg-[var(--color-panel-strong)]/55 p-4">
                    <input name="id" type="hidden" value={client.id} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="label">Client name</p>
                        <input className="field mt-2" name="name" defaultValue={client.name} minLength={2} required />
                      </div>
                      <div>
                        <p className="label">Company</p>
                        <input className="field mt-2" name="company" defaultValue={client.company} minLength={2} required />
                      </div>
                      <div>
                        <p className="label">Email</p>
                        <input className="field mt-2" name="email" type="email" defaultValue={client.email} />
                      </div>
                      <div>
                        <p className="label">Phone</p>
                        <input className="field mt-2" name="phone" type="tel" defaultValue={client.phone} />
                      </div>
                    </div>
                    <div>
                      <p className="label">Notes</p>
                      <textarea className="field-area mt-2" name="notes" defaultValue={client.notes} />
                    </div>
                    <SubmitButton className="btn-secondary" pendingText="Updating client...">
                      Update client
                    </SubmitButton>
                    <ConfirmSubmitButton
                      className="mt-3 text-xs uppercase tracking-[0.18em] text-[rgba(255,228,214,0.9)] transition hover:text-[rgba(255,200,180,0.98)]"
                      confirmMessage="Delete this client and all linked projects?"
                      formAction={deleteClientAction}
                      formNoValidate={true}
                      pendingText="Deleting..."
                    >
                      Delete client
                    </ConfirmSubmitButton>
                  </form>
                </details>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
