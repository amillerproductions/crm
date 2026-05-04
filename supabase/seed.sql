insert into clients (id, name, company, email, phone, notes) values
  ('client-1', 'Sarah Holloway', 'Holloway Fitness', 'sarah@hollowayfitness.com', '(614) 555-0184', 'Needs fast revisions during the homepage round and wants a stronger local SEO angle before launch.'),
  ('client-2', 'Marcus Bell', 'Bell Roofing & Exteriors', 'marcus@bellroofing.com', '(740) 555-0148', 'Responds fastest by text. Wants trust-focused design and an easier quote request path.'),
  ('client-3', 'Tanya Ruiz', 'Ruiz Dental Studio', 'office@ruizdentalstudio.com', '(937) 555-0126', 'Interested in ongoing maintenance after launch and has separate logins for hosting, domain, and forms.'),
  ('client-4', 'Noah Brooks', 'Ridgeview Outdoors', 'hello@ridgeviewoutdoors.com', '(513) 555-0189', 'Still deciding between a full redesign and a homepage-only refresh, so outreach needs a clear scope option.'),
  ('client-5', 'Kelsey Moore', 'Oak & Ember Catering', 'events@oakembercatering.com', '(380) 555-0171', 'Completed project. Good candidate for maintenance retainers and seasonal landing pages later.')
on conflict (id) do nothing;

insert into prospects (id, name, company, email, phone, source, status, notes, next_follow_up, estimated_value) values
  ('prospect-1', 'Alyssa Kent', 'Kent Wellness Co.', 'alyssa@kentwellness.co', '(614) 555-0118', 'Instagram', 'Reached out', 'Interested in a cleaner booking-focused homepage and a simple service breakdown. Wants rough pricing first.', '2026-04-28', 2800),
  ('prospect-2', 'David Mercer', 'Mercer Home Group', 'david@mercerhomegroup.com', '(740) 555-0130', 'Referral', 'Call booked', 'Discovery call booked for next week. Current site feels outdated and lead forms are weak.', '2026-04-26', 4200),
  ('prospect-3', 'Brianna Cole', 'Cole Event Design', 'hello@coleeventdesign.com', '(937) 555-0143', 'Website inquiry', 'Proposal sent', 'Sent proposal with a brand-forward wedding/events concept and optional hosting add-on.', '2026-04-29', 3600)
on conflict (id) do nothing;

insert into prospect_proposals (
  id, prospect_id, proposal_number, title, amount, status, sent_date, valid_until, accepted_date, notes, project_name, overview, payment_structure, installment_count, hosting_enabled, hosting_amount
) values
  (
    'proposal-1',
    'prospect-3',
    'PROP-1001',
    'Cole Event Design website proposal',
    3600,
    'Sent',
    '2026-04-22',
    '2026-05-03',
    null,
    'Includes an optional hosting add-on and a streamlined event inquiry flow.',
    'Cole Event Design Launch',
    'Elegant brochure-style site with homepage, services, gallery, about, and contact experience tailored for wedding and event inquiries.',
    '50/50 split',
    0,
    true,
    39
  )
on conflict (id) do nothing;

insert into prospect_proposal_items (id, proposal_id, description, quantity, unit_price, sort_order) values
  ('proposal-item-1', 'proposal-1', 'Custom website design and build', 1, 3200, 0),
  ('proposal-item-2', 'proposal-1', 'Inquiry flow setup and launch support', 1, 400, 1)
on conflict (id) do nothing;

insert into tasks (id, title, details, due_date, status, priority, project_id, client_id, prospect_id) values
  ('task-1', 'Follow up on Holloway homepage copy', 'Check in on testimonial headshots and final hero copy so the homepage can move out of waiting.', '2026-04-28', 'To do', 'High', 'project-1', 'client-1', null),
  ('task-2', 'Confirm Bell Roofing contact form inbox', 'Need final destination inbox before the launch-ready project can move into handoff.', '2026-04-27', 'In progress', 'Urgent', 'project-2', 'client-2', null),
  ('task-3', 'Prepare Ruiz final invoice follow-up', 'Draft a gentle overdue reminder and confirm whether the client needs anything before paying the final installment.', '2026-04-29', 'Waiting', 'Normal', 'project-3', 'client-3', null),
  ('task-4', 'Discovery prep for Mercer Home Group', 'Pull example layouts and outline the main conversion issues to cover on the booked call.', '2026-04-26', 'To do', 'High', null, null, 'prospect-2')
on conflict (id) do nothing;

insert into projects (
  id, client_id, name, stage, working_url, live_url, contract_amount, payment_structure, installment_count, payments_received_count, payment_status, hosting_enabled, hosting_amount, homepage_status, homepage_notes, overview
) values
  ('project-1', 'client-1', 'Holloway Fitness Redesign', 'Site Build', 'preview.kagemedia.dev/holloway', 'hollowayfitness.com', 3800, '50/50 split', 0, 1, 'Deposit paid', true, 39, 'Waiting on client feedback', 'Homepage layout is built. Hero and class schedule section need final copy and approval from Sarah.', 'Local fitness studio redesign focused on stronger lead capture, faster mobile performance, and cleaner conversion flow for class signups.'),
  ('project-2', 'client-2', 'Bell Roofing Growth Site', 'Launch Ready', 'staging.kagemedia.dev/bell-roofing', 'bellroofingohio.com', 5400, '50/50 split', 0, 1, '50% remaining', true, 65, 'Approved', 'Homepage approved. Final QA before pointing domain and swapping forms.', 'Trust-first contractor site with stronger quote flow, service area pages, and local SEO structure for roofing searches.'),
  ('project-3', 'client-3', 'Ruiz Dental Launch', 'Payment Requested', 'preview.kagemedia.dev/ruiz-dental', 'ruizdentalstudio.com', 4600, 'Installments', 3, 2, 'Invoice sent', true, 55, 'Approved', 'Site is launched. Final invoice sent and waiting for payment to close out.', 'Modern dental practice launch site with patient trust focus, appointment CTAs, and treatment pages.'),
  ('project-4', 'client-3', 'Patient Forms Cleanup', 'Lead Found', 'Not started', 'ruizdentalstudio.com/forms', 900, 'Paid in full', 0, 0, 'Not invoiced', false, 0, 'Not started', 'Mini follow-up project. Need to decide whether this stays a small update or becomes part of a maintenance retainer.', 'Potential cleanup project for intake form UX and conversion flow after the main launch wrapped.'),
  ('project-5', 'client-4', 'Ridgeview Outdoors Refresh', 'Outreach / Offer Sent', 'Proposal only', 'ridgeviewoutdoors.com', 2100, 'Paid in full', 0, 0, 'Not invoiced', false, 0, 'Not started', 'Proposal sent. Waiting to hear whether they want a homepage refresh or a broader site overhaul.', 'Outdoor brand refresh pitch with stronger storytelling, cleaner mobile layout, and improved ecommerce navigation.'),
  ('project-6', 'client-5', 'Oak & Ember Catering', 'Complete', 'preview.kagemedia.dev/oak-ember', 'oakembercatering.com', 3200, 'Paid in full', 0, 1, 'Paid in full', true, 49, 'Approved', 'Completed project archived for reference and future add-on work.', 'Polished catering site with event inquiry flow, seasonal menu updates, and gallery-first presentation.')
on conflict (id) do nothing;

insert into project_credentials (project_id, label, username, password_value, url, notes) values
  ('project-1', 'SiteGround Hosting', 'sarah.holloway', 'change-me', 'tools.siteground.com', 'Primary hosting account for the migration.'),
  ('project-1', 'WordPress Admin', 'kage-admin', 'change-me', 'preview.kagemedia.dev/holloway/wp-admin', 'Use this until launch, then rotate once the site goes live.'),
  ('project-2', 'Domain Registrar', 'marcus.bell', 'change-me', 'godaddy.com', 'Needed for DNS changes on launch day.'),
  ('project-2', 'Google Business', 'office@bellroofing.com', 'change-me', 'business.google.com', 'Use after launch to update website URL.'),
  ('project-3', 'Squarespace Domain', 'office@ruizdentalstudio.com', 'change-me', 'account.squarespace.com', 'Old registrar login kept for renewal tracking.'),
  ('project-6', 'Hosting', 'kelsey@oakembercatering.com', 'change-me', 'my.hostingprovider.com', 'Kept for future maintenance requests.');

insert into project_pages (id, project_id, title, status, notes, issues, sort_order) values
  ('page-1', 'project-1', 'Homepage', 'In progress', 'Core sections built. Waiting on approved headline copy.', 'Need updated testimonial headshots.', 1),
  ('page-2', 'project-1', 'Membership', 'Not started', 'Will reuse pricing section patterns from homepage.', 'Need final class package details.', 2),
  ('page-3', 'project-1', 'About', 'Not started', 'Use founder story and trainer bios.', '', 3),
  ('page-4', 'project-2', 'Homepage', 'Complete', 'Approved by Marcus.', '', 1),
  ('page-5', 'project-2', 'Roof Repair', 'Complete', 'Service CTA and trust badges added.', '', 2),
  ('page-6', 'project-2', 'Contact', 'In progress', 'Final form delivery test left.', 'Need to confirm destination inbox.', 3),
  ('page-7', 'project-3', 'Homepage', 'Complete', 'Approved and live.', '', 1),
  ('page-8', 'project-3', 'Services', 'Complete', 'Treatments and FAQ published.', '', 2),
  ('page-9', 'project-3', 'New Patients', 'Complete', 'Forms linked and tested.', '', 3),
  ('page-10', 'project-4', 'Patient Forms', 'Not started', 'Audit current form friction and drop-off points.', '', 1),
  ('page-11', 'project-5', 'Homepage', 'Not started', 'Pending approved scope.', '', 1),
  ('page-12', 'project-6', 'Homepage', 'Complete', 'Complete.', '', 1),
  ('page-13', 'project-6', 'Menus', 'Complete', 'Complete.', '', 2)
on conflict (id) do nothing;

insert into project_invoices (id, project_id, invoice_number, title, amount, status, share_enabled, share_token, sent_date, due_date, paid_date, notes) values
  ('invoice-1', 'project-1', 'KAGE-1001', 'Kickoff deposit', 1900, 'Paid', true, 'share-invoice-1', '2026-04-02', '2026-04-12', '2026-04-05', 'Deposit invoice sent at kickoff.'),
  ('invoice-2', 'project-1', 'KAGE-1002', 'Final balance', 1900, 'Draft', false, 'share-invoice-2', null, null, null, 'Hold until final approvals are signed off.'),
  ('invoice-3', 'project-2', 'KAGE-1003', 'Initial deposit', 2700, 'Paid', true, 'share-invoice-3', '2026-03-22', '2026-04-01', '2026-03-28', 'Deposit paid before content lock.'),
  ('invoice-4', 'project-2', 'KAGE-1004', 'Final launch invoice', 2700, 'Overdue', true, 'share-invoice-4', '2026-04-21', '2026-04-23', null, 'Final payment due before launch handoff.'),
  ('invoice-5', 'project-3', 'KAGE-1005', 'Installment 1', 1533, 'Paid', true, 'share-invoice-5', '2026-03-14', '2026-03-21', '2026-03-18', 'First installment settled quickly.'),
  ('invoice-6', 'project-3', 'KAGE-1006', 'Installment 2', 1533, 'Paid', true, 'share-invoice-6', '2026-03-30', '2026-04-06', '2026-04-03', 'Second installment cleared during QA.'),
  ('invoice-7', 'project-3', 'KAGE-1007', 'Final installment', 1534, 'Overdue', true, 'share-invoice-7', '2026-04-15', '2026-04-22', null, 'Final payment still open after launch.'),
  ('invoice-8', 'project-6', 'KAGE-1008', 'Project closeout', 3200, 'Paid', true, 'share-invoice-8', '2026-02-16', '2026-02-23', '2026-02-18', 'Project paid in full after final delivery.')
on conflict (id) do nothing;

insert into project_invoice_items (id, invoice_id, description, quantity, unit_price, sort_order) values
  ('invoice-item-1', 'invoice-1', 'Website redesign kickoff deposit', 1, 1900, 0),
  ('invoice-item-2', 'invoice-2', 'Final website design and launch balance', 1, 1900, 0),
  ('invoice-item-3', 'invoice-3', 'Initial deposit for design and build start', 1, 2700, 0),
  ('invoice-item-4', 'invoice-4', 'Final launch balance and QA closeout', 1, 2700, 0),
  ('invoice-item-5', 'invoice-5', 'Installment 1 for website strategy and homepage build', 1, 1533, 0),
  ('invoice-item-6', 'invoice-6', 'Installment 2 for services pages and content integration', 1, 1533, 0),
  ('invoice-item-7', 'invoice-7', 'Final installment for launch, forms, and post-launch cleanup', 1, 1534, 0),
  ('invoice-item-8', 'invoice-8', 'Full website project closeout', 1, 3200, 0)
on conflict (id) do nothing;

insert into project_finance_entries (id, project_id, invoice_id, entry_date, due_date, kind, amount, note) values
  ('finance-1', 'project-1', 'invoice-1', '2026-04-02', '2026-04-12', 'Invoice sent', 1900, 'Deposit invoice sent at kickoff.'),
  ('finance-2', 'project-1', 'invoice-1', '2026-04-05', null, 'Payment received', 1900, 'Deposit paid via bank transfer.'),
  ('finance-3', 'project-2', 'invoice-3', '2026-03-22', '2026-04-01', 'Invoice sent', 2700, 'Initial 50% invoice sent.'),
  ('finance-4', 'project-2', 'invoice-3', '2026-03-28', null, 'Payment received', 2700, 'Deposit received.'),
  ('finance-5', 'project-2', 'invoice-4', '2026-04-21', '2026-04-23', 'Invoice sent', 2700, 'Final invoice sent before launch.'),
  ('finance-6', 'project-3', 'invoice-5', '2026-03-14', '2026-03-21', 'Invoice sent', 1533, 'Installment 1 sent.'),
  ('finance-7', 'project-3', 'invoice-5', '2026-03-18', null, 'Payment received', 1533, 'Installment 1 received.'),
  ('finance-8', 'project-3', 'invoice-6', '2026-03-30', '2026-04-06', 'Invoice sent', 1533, 'Installment 2 sent.'),
  ('finance-9', 'project-3', 'invoice-6', '2026-04-03', null, 'Payment received', 1533, 'Installment 2 received.'),
  ('finance-10', 'project-3', 'invoice-7', '2026-04-15', '2026-04-22', 'Invoice sent', 1534, 'Final installment sent after launch.'),
  ('finance-11', 'project-4', null, '2026-04-08', null, 'Note', 0, 'Scope still being decided before any invoice goes out.'),
  ('finance-12', 'project-5', null, '2026-04-02', null, 'Note', 0, 'Proposal sent. No invoice until scope is approved.'),
  ('finance-13', 'project-6', 'invoice-8', '2026-02-16', '2026-02-23', 'Invoice sent', 3200, 'Full project invoice sent.'),
  ('finance-14', 'project-6', 'invoice-8', '2026-02-18', null, 'Payment received', 3200, 'Project paid in full.'),
  ('finance-15', 'project-6', null, '2026-04-01', '2026-04-01', 'Hosting billed', 49, 'Monthly hosting charge.')
on conflict (id) do nothing;
