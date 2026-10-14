# Security and operational boundaries

The cloud edition is a single-company application. Supabase Auth verifies identity; the Edge Function looks up the verified user ID in a server-owned membership table on every request. Browser roles and user metadata do not grant access. PostgreSQL tables and privileged RPCs deny `anon` and `authenticated` clients. The service credential belongs only in server secrets.

Employees receive their own records. Managers receive their own/team operational records with colleague compensation removed. HR receives HR records; Finance receives compensation and the data needed for payroll. The owner remains an active administrator. Membership edits and record writes share an atomic revision lock; stale writes are rejected for human review.

The frontend stores authentication tokens in sessionStorage. It does not cache HR state in localStorage. Language and appearance preferences may persist. Exports and printed payslips contain private data and must be handled accordingly. HTTPS and the supplied Apache headers are part of deployment; inspect the actual responses after upload.

Google Drive documents inherit their parent folder's permissions. A writable folder check is **not a privacy audit**: use a restricted archive and verify its permissions before enabling uploads. File signatures are checked, but this is not antivirus scanning. A failed concurrent save can leave an unreferenced private file; reconcile it with the audit trail before removal.

Resend sends a private-portal notice after Finance approval, not an attached payroll PDF or a bank transfer. Durable delivery claims prevent automatic retries of uncertain sends. Provider acceptance is not proof of delivery. Keep `sending` and `review_required` records for reconciliation; do not clear them just to retry.

Backups use AES-256-GCM and a separate server-side encryption key. They include HR data and account memberships, not Auth passwords, original documents or the complete email/audit tables. Keep a secure copy of the key, separate provider/database backups, a retention policy and a tested recovery procedure. The app currently creates manual snapshots, not scheduled backups.

Do not publish production exports, OAuth refresh tokens, provider keys, service-role keys, backup keys, `.env` files or configured bootstrap SQL. Only the Supabase URL and publishable/anon key may appear in the static configuration. The release packager uses an allowlist and omits local config and runtime artifacts; review changes before each public release.

Report a suspected vulnerability privately to the repository owner through GitHub Private vulnerability reporting if enabled. Do not post employee data or working credentials in public issues. If a credential is exposed, revoke it at its provider and replace it; removing the latest Git file alone does not remove it from history.

Automated checks are not a penetration test or live deployment certification. Before employee onboarding, verify account isolation, disabled accounts, password recovery, actual mail delivery, Drive sharing and backup recovery with designated test accounts.
