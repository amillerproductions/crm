# KAGE Media CRM - V1 Plan

## Goal

Build a custom internal CRM + kanban app for KAGE Media that helps track:

- leads and clients
- website project progress
- homepage and page-by-page work
- credentials and URLs
- contract value and payment status

The app should feel brand-aligned with the KAGE Media site and be usable on desktop first, while still working well on mobile.

## Recommended Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
  - Postgres for data
  - Auth for private access
  - Storage if you later want files/assets
- Vercel for deployment

Why this stack:

- easy to access from phone and desktop
- fast to build and iterate
- clean path to auth, database, and deployment
- flexible enough for custom workflow without fighting a prebuilt CRM

## Brand Direction

Use the KAGE Media visual language instead of a generic admin theme.

### Core Colors

- `--bg: #0d151d`
- `--panel: #183648`
- `--accent: #5187a9`
- `--accent-strong: #335671`
- `--soft: #e9e4d8`

### UI Notes

- dark, polished surfaces
- muted cream typography for major labels and branding moments
- blue accents for interactive elements
- clean spacing and strong contrast
- desktop-focused layout with mobile support

## Business Workflow

Primary project stages:

1. Lead Found
2. Outreach / Offer Sent
3. Homepage In Progress
4. Homepage Review
5. Full Site Build
6. Launch Ready
7. Payment Requested
8. Complete

## V1 Must-Haves

- add and edit clients
- add and edit projects
- connect projects to clients
- view projects in a kanban board by stage
- store working URL and live URL
- store contract amount and payment status
- store usernames/passwords/account notes
- track homepage task notes
- track pages list with:
  - page name
  - notes
  - issues
  - complete status

## Recommended V1 Screens

### 1. Dashboard

Quick snapshot of:

- active projects
- unpaid total
- projects waiting on homepage approval
- projects ready for launch

### 2. Clients

- client list
- add client form
- edit client info
- linked projects section

### 3. Projects Board

- kanban board grouped by stage
- project cards showing:
  - client name
  - project name
  - contract amount
  - payment status
  - current stage

### 4. Project Detail

Main workspace for each build:

- overview
  - client
  - working URL
  - live URL
  - contract amount
  - payment status
  - stage
- credentials
  - service name
  - username
  - password
  - notes
- homepage task
  - status
  - notes
- pages task list
  - add/remove pages
  - per-page notes
  - per-page issues
  - per-page complete toggle

## Data Model

### clients

- `id`
- `name`
- `email`
- `phone`
- `company_name`
- `notes`
- `created_at`
- `updated_at`

### projects

- `id`
- `client_id`
- `name`
- `stage`
- `working_url`
- `live_url`
- `contract_amount`
- `payment_status`
- `payment_requested_at`
- `paid_at`
- `overview_notes`
- `created_at`
- `updated_at`

### credentials

- `id`
- `project_id`
- `label`
- `username`
- `password_encrypted`
- `url`
- `notes`
- `created_at`
- `updated_at`

### homepage_tasks

- `id`
- `project_id`
- `status`
- `notes`
- `completed_at`

### project_pages

- `id`
- `project_id`
- `title`
- `status`
- `notes`
- `issues`
- `sort_order`
- `completed_at`
- `created_at`
- `updated_at`

## Security Note

Passwords should not be stored as plain text in a normal field long-term.

For v1, we can choose one of these paths:

1. Basic internal-tool version:
Store credentials in Supabase with restricted access, and add an app warning that sensitive data lives there.

2. Better version:
Encrypt credential values before storage using an app-level encryption key.

I recommend option 2 before real usage.

## Route Plan

- `/` dashboard
- `/clients` client list
- `/clients/new` add client
- `/clients/[id]` client detail
- `/projects` kanban board
- `/projects/new` add project
- `/projects/[id]` project detail

## Build Order

### Phase 1

- scaffold Next.js app
- set up Tailwind theme tokens
- bring in KAGE logo
- build app shell and navigation

### Phase 2

- create Supabase schema
- add client CRUD
- add project CRUD

### Phase 3

- build kanban board
- build project detail page
- add homepage + pages tracking

### Phase 4

- add credentials section
- add money summary
- refine mobile layout and visual polish

## What V1 Should Feel Like

Not a bloated CRM. It should feel like:

- a focused control center for your website projects
- fast to update during the workday
- clean enough that you actually want to use it
- tailored to your process instead of forcing you into somebody else's workflow
