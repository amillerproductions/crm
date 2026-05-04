create extension if not exists pgcrypto;

create table if not exists clients (
  id text primary key,
  name text not null,
  company text not null,
  email text not null default '',
  phone text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prospects (
  id text primary key,
  name text not null,
  company text not null,
  email text not null default '',
  phone text not null default '',
  source text not null default '',
  status text not null default 'New lead' check (
    status in ('New lead', 'Reached out', 'Call booked', 'Proposal sent', 'On hold')
  ),
  notes text not null default '',
  next_follow_up date,
  estimated_value numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists account_credentials (
  id text primary key,
  user_id uuid not null,
  label text not null default '',
  username text not null default '',
  password_value text not null default '',
  url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table account_credentials enable row level security;

drop policy if exists "Users can view their own account credentials" on account_credentials;
create policy "Users can view their own account credentials"
on account_credentials
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own account credentials" on account_credentials;
create policy "Users can insert their own account credentials"
on account_credentials
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own account credentials" on account_credentials;
create policy "Users can update their own account credentials"
on account_credentials
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own account credentials" on account_credentials;
create policy "Users can delete their own account credentials"
on account_credentials
for delete
using (auth.uid() = user_id);

create table if not exists prospect_proposals (
  id text primary key,
  prospect_id text not null references prospects(id) on delete cascade,
  proposal_number text not null default '',
  title text not null default '',
  amount numeric(12, 2) not null default 0,
  status text not null default 'Draft' check (
    status in ('Draft', 'Sent', 'Accepted', 'Declined')
  ),
  sent_date date,
  valid_until date,
  accepted_date date,
  notes text not null default '',
  project_name text not null default '',
  overview text not null default '',
  payment_structure text not null default 'Paid in full' check (
    payment_structure in ('Paid in full', '50/50 split', 'Installments')
  ),
  installment_count integer not null default 0 check (installment_count >= 0),
  hosting_enabled boolean not null default false,
  hosting_amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prospect_proposal_items (
  id text primary key,
  proposal_id text not null references prospect_proposals(id) on delete cascade,
  description text not null default '',
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id text primary key,
  title text not null,
  details text not null default '',
  due_date date,
  status text not null default 'To do' check (
    status in ('To do', 'In progress', 'Waiting', 'Done')
  ),
  priority text not null default 'Normal' check (
    priority in ('Low', 'Normal', 'High', 'Urgent')
  ),
  project_id text references projects(id) on delete set null,
  client_id text references clients(id) on delete set null,
  prospect_id text references prospects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id text primary key,
  client_id text not null references clients(id) on delete cascade,
  name text not null,
  stage text not null check (
    stage in (
      'Lead Found',
      'Outreach / Offer Sent',
      'Site Build',
      'Launch Ready',
      'Payment Requested',
      'Complete'
    )
  ),
  working_url text not null default '',
  live_url text not null default '',
  contract_amount numeric(12, 2) not null default 0,
  payment_structure text not null default 'Paid in full' check (
    payment_structure in ('Paid in full', '50/50 split', 'Installments')
  ),
  installment_count integer not null default 0 check (installment_count >= 0),
  payments_received_count integer not null default 0 check (payments_received_count >= 0),
  payment_status text not null default 'Not invoiced',
  hosting_enabled boolean not null default false,
  hosting_amount numeric(10, 2) not null default 0,
  homepage_status text not null default 'Not started',
  homepage_notes text not null default '',
  attention_priority text not null default 'Normal' check (
    attention_priority in ('Low', 'Normal', 'High', 'Urgent')
  ),
  waiting_on text not null default '',
  next_action text not null default '',
  follow_up_date date,
  overview text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table projects add column if not exists payment_structure text not null default 'Paid in full';
alter table projects add column if not exists installment_count integer not null default 0;
alter table projects add column if not exists payments_received_count integer not null default 0;
alter table projects add column if not exists hosting_enabled boolean not null default false;
alter table projects add column if not exists hosting_amount numeric(10, 2) not null default 0;

alter table projects drop constraint if exists projects_payment_structure_check;
alter table projects add constraint projects_payment_structure_check check (
  payment_structure in ('Paid in full', '50/50 split', 'Installments')
);

alter table projects drop constraint if exists projects_installment_count_check;
alter table projects add constraint projects_installment_count_check check (installment_count >= 0);

alter table projects drop constraint if exists projects_payments_received_count_check;
alter table projects add constraint projects_payments_received_count_check check (payments_received_count >= 0);

create table if not exists project_credentials (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references projects(id) on delete cascade,
  label text not null,
  username text not null default '',
  password_value text not null default '',
  url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_pages (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  title text not null,
  status text not null check (status in ('Not started', 'In progress', 'Complete')),
  notes text not null default '',
  issues text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_invoices (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  invoice_number text not null default '',
  title text not null default '',
  amount numeric(12, 2) not null default 0,
  status text not null default 'Draft' check (
    status in ('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled')
  ),
  share_enabled boolean not null default false,
  share_token text unique,
  sent_date date,
  due_date date,
  paid_date date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_invoice_items (
  id text primary key,
  invoice_id text not null references project_invoices(id) on delete cascade,
  description text not null default '',
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table project_invoices add column if not exists share_enabled boolean not null default false;
alter table project_invoices add column if not exists share_token text;
create unique index if not exists idx_project_invoices_share_token on project_invoices(share_token);

create table if not exists project_finance_entries (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  invoice_id text references project_invoices(id) on delete set null,
  entry_date date not null,
  due_date date,
  kind text not null check (
    kind in ('Invoice sent', 'Payment received', 'Hosting billed', 'Refund', 'Note')
  ),
  amount numeric(12, 2) not null default 0,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table project_finance_entries add column if not exists invoice_id text references project_invoices(id) on delete set null;
alter table project_finance_entries add column if not exists due_date date;

create index if not exists idx_projects_client_id on projects(client_id);
create index if not exists idx_projects_stage on projects(stage);
create index if not exists idx_prospects_status on prospects(status);
create index if not exists idx_account_credentials_user_id on account_credentials(user_id);
create index if not exists idx_prospect_proposals_prospect_id on prospect_proposals(prospect_id);
create index if not exists idx_prospect_proposal_items_proposal_id on prospect_proposal_items(proposal_id);
create index if not exists idx_tasks_due_date on tasks(due_date);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_project_credentials_project_id on project_credentials(project_id);
create index if not exists idx_project_pages_project_id on project_pages(project_id);
create index if not exists idx_project_invoices_project_id on project_invoices(project_id);
create index if not exists idx_project_invoice_items_invoice_id on project_invoice_items(invoice_id);
create index if not exists idx_project_finance_entries_project_id on project_finance_entries(project_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on clients;
create trigger clients_set_updated_at
before update on clients
for each row execute function set_updated_at();

drop trigger if exists prospects_set_updated_at on prospects;
create trigger prospects_set_updated_at
before update on prospects
for each row execute function set_updated_at();

drop trigger if exists account_credentials_set_updated_at on account_credentials;
create trigger account_credentials_set_updated_at
before update on account_credentials
for each row execute function set_updated_at();

drop trigger if exists prospect_proposals_set_updated_at on prospect_proposals;
create trigger prospect_proposals_set_updated_at
before update on prospect_proposals
for each row execute function set_updated_at();

drop trigger if exists prospect_proposal_items_set_updated_at on prospect_proposal_items;
create trigger prospect_proposal_items_set_updated_at
before update on prospect_proposal_items
for each row execute function set_updated_at();

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at
before update on tasks
for each row execute function set_updated_at();

drop trigger if exists projects_set_updated_at on projects;
create trigger projects_set_updated_at
before update on projects
for each row execute function set_updated_at();

drop trigger if exists project_credentials_set_updated_at on project_credentials;
create trigger project_credentials_set_updated_at
before update on project_credentials
for each row execute function set_updated_at();

drop trigger if exists project_pages_set_updated_at on project_pages;
create trigger project_pages_set_updated_at
before update on project_pages
for each row execute function set_updated_at();

drop trigger if exists project_invoices_set_updated_at on project_invoices;
create trigger project_invoices_set_updated_at
before update on project_invoices
for each row execute function set_updated_at();

drop trigger if exists project_invoice_items_set_updated_at on project_invoice_items;
create trigger project_invoice_items_set_updated_at
before update on project_invoice_items
for each row execute function set_updated_at();

drop trigger if exists project_finance_entries_set_updated_at on project_finance_entries;
create trigger project_finance_entries_set_updated_at
before update on project_finance_entries
for each row execute function set_updated_at();
