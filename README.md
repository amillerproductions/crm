# KAGE Media CRM

Custom CRM and project board for KAGE Media, built with Next.js and wired for Supabase.

## Current State

- branded dashboard, clients page, project board, and project detail pages
- Supabase-backed data layer with automatic mock fallback
- single-user Supabase Auth gate with allowed-email restriction
- SQL schema and seed files included in `/supabase`

If Supabase env vars are missing, the app still runs from local mock data so the UI stays usable while setup is in progress.

## Local Run

```bash
cd "/Users/andrewmiller/Documents/Custom CRM"
PATH="$PWD:/Users/andrewmiller/Library/pnpm:$PATH" /Users/andrewmiller/Library/pnpm/pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_EMAIL=your-email@example.com
CREDENTIAL_ENCRYPTION_SECRET=your-long-random-secret
```

4. In the Supabase SQL editor, run:
   - [supabase/schema.sql](/Users/andrewmiller/Documents/Custom%20CRM/supabase/schema.sql:1)
   - [supabase/seed.sql](/Users/andrewmiller/Documents/Custom%20CRM/supabase/seed.sql:1)
5. In Supabase Authentication:
   - enable Email authentication
   - enable email/password sign-in
   - create your user in Supabase Auth with the same address as `ALLOWED_EMAIL`
   - disable public signups if you want the strictest setup
   - set the site URL to your app URL
   - add `http://localhost:3000/reset-password` to your redirect URLs for local password recovery

After that, the app will start reading from Supabase instead of the local mock dataset.

For internal CRM write actions like deleting projects or clients, adding
`SUPABASE_SERVICE_ROLE_KEY` is recommended so server actions can perform admin
writes even if your Supabase API policies are stricter.

## Access Control

The app now uses Supabase email/password auth and only allows the email in `ALLOWED_EMAIL`.

- sign-in happens at `/login`
- password reset starts from `/login` and finishes at `/reset-password`
- protected app routes redirect to login if there is no valid session
- if someone signs in with a different email, they are rejected

## Credential Encryption

Credential usernames and passwords are now encrypted in the app layer before being stored in Supabase.

- set `CREDENTIAL_ENCRYPTION_SECRET` in `.env.local`
- use a long random value and keep it safe
- existing plaintext credential rows remain readable for now
- once an old credential is edited and saved again, it will be stored encrypted

If the secret is missing, encrypted credentials cannot be decrypted correctly.

## Key Files

- [src/lib/crm-data.ts](/Users/andrewmiller/Documents/Custom%20CRM/src/lib/crm-data.ts:1) data access layer
- [src/lib/supabase.ts](/Users/andrewmiller/Documents/Custom%20CRM/src/lib/supabase.ts:1) Supabase client setup
- [src/lib/mock-data.ts](/Users/andrewmiller/Documents/Custom%20CRM/src/lib/mock-data.ts:1) fallback dataset
- [src/views/projects-page.tsx](/Users/andrewmiller/Documents/Custom%20CRM/src/views/projects-page.tsx:1) project board
- [src/views/project-detail-page.tsx](/Users/andrewmiller/Documents/Custom%20CRM/src/views/project-detail-page.tsx:1) project workspace
