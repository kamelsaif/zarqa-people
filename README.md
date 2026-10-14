# Zarqa People

An Arabic / English HR web app by Kamel Saif and Zarqa. A practical, open-source demonstration of a hiring-to-offboarding workflow, with Google Workspace and GoDaddy/Supabase deployment editions.

## Cloud edition — deployment preparation

The new `cloud/` edition uses Supabase email/password authentication and PostgreSQL, with a static frontend for GoDaddy, private Google Drive documents, and Resend payslip notices. It starts empty and locked until configured. **Live account configuration, deployment and end-to-end verification are still pending.**

Start with [the deployment guide](docs/CLOUD-DEPLOYMENT.md), [security boundaries](SECURITY.md) and [the reel recording plan](docs/DEMO-REEL.md). `npm ci && npm test` builds and checks the cloud edition; `python3 scripts/package-cloud.py` creates the GoDaddy, backend and sanitized GitHub packages. GitHub CI runs the same checks. The project source includes all three editions; real company data and service credentials do not belong in the repository.

## What works

- Date and department filters; calculated headcount, hiring, turnover, attendance and estimated payroll.
- Internal job listings, applicant pipeline, offer stage and hire-to-employee conversion.
- Employee directory and profiles.
- A prominent All employees entry in the main navigation and dashboard, with cards/table views, employee profile links, counts, Arabic/English search, department/status filters, sorting and pagination. Directory filters are independent of dashboard filters. Managers see their team; HR/Admin see all employee records, including inactive staff.
- Coordinated blue, teal, violet, gold and rose accents distinguish navigation modules, metrics and departments while status labels remain explicit.
- Grouped Arabic/English navigation, a decision-focused dashboard, quick date ranges, responsive layouts and `Ctrl/Cmd + K` search for pages and people.
- Readable, self-hosted IBM Plex Sans Arabic / Inter fonts, consistent Lucide icons, clearer titles and status colours, and a light navigation panel. Display preferences let each user choose a larger text size and comfortable/compact table spacing on their own device. These do not alter HR data.
- A request inbox with 17 request types, editable approval routes, versioned route snapshots, decision history, withdrawal and fulfillment notes. Requests include leave, loans, penalties, expenses, resignation, termination, document borrowing, transfer, promotion, permission, HR letters, business missions, overtime, loan settlement, leave encashment, remote work and shift changes.
- Private hiring-document archive: employees upload PDF/PNG/JPEG from onboarding; HR reviews, approves or requests replacement. In the live edition, Drive stores files under a dedicated Employment Documents archive and per-employee folders; no public sharing grants. Demo file bytes use IndexedDB, not the cloud.
- Interactive onboarding: editable policies, practical questions, versioned acknowledgments and progress.
- Leave requests: configurable weekends, working-day calculation, overlap and reserved-balance checks, configurable approvals ending at HR, no self-approval.
- Weekly shift planning, draft/published assignments, overnight shifts and overlap validation. Managers schedule their direct team; employees see their own published assignments.
- Manual attendance entry and corrections, with a required reason. Calculations compare actual records with published shifts, apply the configured grace period and approved permission hours, and exclude approved leave. Approved business missions exempt absence. Missing attendance records never become automatic absence deductions.
- Payroll drafts with custom cut-off dates, reviewable attendance/request adjustments, Finance approval, per-employee payslips, print-to-PDF, editable base inputs and explicitly labelled delivery simulation. Overlapping cut-offs are rejected; request adjustments are consumed once and changed inputs require renewed review.
- Payment records with a reference and date, separate from payslip delivery; this records a completed payment and does not transfer funds.
- Contract register with renewal history, expiry alerts, hiring-document validity dates, and a missing-document view.
- Eleven in-app reports covering people, attendance, leave, requests, contracts, missing documents, payroll, payments, employee movement, onboarding and activity. Reports can be filtered and printed to PDF without opening a spreadsheet.
- Organisation view based on line managers; human performance reviews; team calendar.
- Offboarding checklist and final archival after the last working day.
- Custom name, logo and accent colour; JSON export/import; activity log.
- Administrator-only Data & access centre (`/#data`) with explicit demo/cloud status, storage mapping, searchable employee/account roles, Google setup guidance, backup coverage and record shortcuts. In the Workspace edition, Check connection verifies configured storage access and Create backup now saves a private snapshot after a server administrator check. Neither action connects the hosted demo to Google.
- Arabic RTL / English LTR interface.
- Optional country detection via ipapi.co after an in-app disclosure. A reviewed official-source labour-law hub for Egypt, Saudi Arabia, UAE, UK, US and Canada; ILO NATLEX fallback for other countries.

## Three editions

| Edition | Storage | Identity | Email |
|---|---|---|---|
| `dist/` demo | Browser localStorage | Demo role selector | Simulation only |
| `cloud/` | Supabase PostgreSQL + restricted Drive | Verified Supabase user ID + server membership | Resend portal notices after Finance approval |
| `google-workspace/` | Google Sheets + private Drive folder | Workspace domain identity + server role checks | Apps Script MailApp after Finance approval |

The hosted demonstration is **not a production employee authentication system**. All seeded people, emails and payroll amounts are fictional. The law hub contains dated reference summaries; it does not automatically update legal rules or apply entitlements. Social job advertising, biometric attendance, bank transfers, external-account deactivation, payroll tax calculations and statutory compliance certification are outside this version. Approval does not automatically execute every request: transfer, promotion, loan, loan settlement, document borrowing, letters, remote work and shift changes require the corresponding action and a fulfillment note. Approved expense, overtime, penalty and leave-encashment amounts can be included in payroll. Leave-encashment requests do not automatically reduce leave balances or calculate legal entitlement. Resignation/termination fulfillment starts offboarding; it never immediately deactivates an employee.

## Run the demonstration

Serve `dist/` with any static HTTP server. No frontend dependencies or build step are required. For example:

```sh
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080`. Use fictional data in the hosted demonstration. Local demo data remains in your current browser and does not sync between devices. Existing demo records are preserved when upgrading; new sections start empty unless you reset the demonstration from Settings.

### Try the updated workflow

1. Open Overview, switch the date range, and select a pending decision. Use the request inbox to inspect the approval history.
2. In Request inbox → Approval workflows, edit a route. Only future requests adopt the new route.
3. Open Shift planner, add a shift and publish the week. Switch the demo role to Employee to see only published personal assignments.
4. Open Attendance → Calculation policy to set company rates and weekends. Rates default to zero; approved overtime requires a rate before payroll application.
5. Prepare a payroll month, review and apply adjustments, then switch to Finance for approval. Delivery simulation and payment recording are separate actions.
6. Open Documents & contracts for renewal reminders and missing hiring papers. Open Reports for filtered, printable summaries.

## Google Workspace deployment

1. Create a new standalone Apps Script project using your company Google Workspace account.
2. Add `Code.gs`, `Model.gs`, `Index.html` and the contents of `appsscript.json` from `google-workspace/`.
3. Set `CONFIG.WORKSPACE_DOMAIN` and `CONFIG.ADMIN_EMAILS` in Code.gs. They must refer to your actual Workspace domain and the project owner.
4. Run `setup()` in the editor once and authorise the scopes. It creates an initially empty HR spreadsheet, policies and a private Drive folder. It refuses to overwrite an existing installation.
5. Deploy as Web app, **execute as the project owner**, **access limited to your Workspace domain**. Do not select anonymous `Anyone` access. A missing active-user email is rejected. Verify active-user identity with a second employee account before real use.
6. Open the deployed app as an administrator. Add employees with correct emails. The database's `Employees` tab contains `id` and JSON columns. Use Employee profile → Edit employee to assign the line manager and salary inputs. Use Data & access → Accounts & access to assign Manager, HR and Finance access. No spreadsheet editing is required. Employees without a privileged role are automatically recognised by their employee email. Never share the database or Drive folder with all staff: the server mediates record access.
7. Review payroll input amounts and leave policy. The current sample payroll uses entered deductions and does **not** calculate local taxes, prorating or social insurance. Have a payroll specialist validate inputs before using them.
8. Prepare a month and approve it as Finance. A preview is available before sending. To enable unattended delivery, enable the scheduling checkbox in Settings and save. Disable it from the same screen. Editor helpers are also available for recovery.
9. A daily Cairo-time trigger checks the current month on or after the configured payday (1–28). Only Finance-approved queued rows are sent, at most 20 per invocation. Additional queued rows send on subsequent days or an explicit manual send. Sent rows are not resent.
10. If a row is `sending` or `review_required`, inspect the email account and private PDF before manually resetting it to `queued`. The app does not automatically retry an ambiguous send, which prevents silent duplicates. A crash between PDF creation and final status also needs manual review.

### Upgrade an existing Workspace installation

Replace the four project files with the current package and deploy a new version of the existing web app. Keep the existing Script Properties and company configuration; do **not** rerun `setup()`. On reading existing records, the application adds missing workflow defaults without replacing data. The first successful write creates the new `Requests`, `Shifts` and `Contracts` tables if absent. Existing leave requests keep their original Manager → HR route. Take a private backup before upgrading and validate with test employee/manager/Finance accounts.

### Operational limits

- Apps Script and MailApp have daily quotas and execution-time limits. This is a small-team MVP, not an enterprise payroll engine.
- ScriptLock serialises writers inside this project. Do not directly edit the database concurrently with app activity or use additional scripts as writers.
- One shift is supported per employee per start date, including an overnight shift up to 16 hours. Attendance is entered against that start date. No device integration or automatic overtime detection is included; overtime must be requested and approved.
- Payroll cut-offs control attendance and request adjustments, not base-salary proration. Rates are company-entered values, not legal defaults. Review lawful deductions, tax, insurance and settlement amounts separately. Approved payroll retains its recorded amounts even if later attendance records change.
- Rows are stored as JSON in Sheets, and full tables are rewritten per mutation. There is no database transaction or row-level index. For larger or regulated deployments, move business records to a transactional database and retain Drive for documents.
- The app includes a dedicated employee portal. The demonstration login uses `employee1@example.com` / `welcome123` and is explicitly not real authentication. The live edition uses each employee’s Google Workspace email and password via Google, with only their records returned by the server. No passwords are stored by this app.

- Hiring-document requirements can be edited from onboarding. Uploads are limited to 2 MB, checked for PDF/PNG/JPEG signatures on the server, archived in a private employee folder and downloaded only after a server ownership/HR check. JSON backups contain metadata, not file bytes; demo document bytes do not travel in JSON exports.

- A private JSON backup is created on the first write of each day. Administrators can also create an immediate snapshot from Data & access → Backups. Last-backup time is loaded from the server by Check connection / Refresh status. Successful manual snapshots are recorded in the activity log. Storage destinations come from server configuration, never browser-supplied IDs. Backups are not automatically deleted; manage retention according to your company policy. The unused retention configuration is advisory and does not delete files.
- Managers receive only their own/team records; colleague salary fields are redacted. Employees receive their own records. HR/Finance/Admin remain privileged. Access control and mail delivery require validation in your own Workspace; they have not been exercised against a live account here.
- Roles and manager relationships are maintained by an administrator from the interface. External identity lifecycle, password recovery and external account revocation are not included.

## Architecture

`seed.js` creates fictional fixtures. `core.js` contains the original shared validation, transitions and KPI calculations. `operations-core.js` adds workflow snapshots, request transitions, shift validation, contract renewal, payroll adjustments and mutation rollback. `workspace.js` and `workspace.css` implement the updated workspaces, reports and navigation. `app.js` renders legacy modules and switches between demo storage and `google.script.run`. `i18n.js` translates UI chrome and demo policy content. `portal.js`, `admin.js` and `documents.js` implement self-service, UI account management and document uploads. `laws.js` contains cited, dated law-source records and country detection. `scripts/package.py` produces a self-contained Apps Script Index.html and both download packages. The browser has no provider secret.

`experience.css` supplies the current typography, semantic colours, spacing, responsive layout and interaction states over the retained module styles. `experience.js` handles display preferences and the navigation drawer. `icons.js` bundles source Lucide paths. `fonts.css` uses local WOFF2 subsets; the Workspace packager embeds them in the HTML. Font and icon licensing is documented in `dist/THIRD-PARTY-NOTICES.md`. No font/icon CDN connection is needed when using the app.

`data-center.js` renders the admin storage, accounts and backups workspace. It does not store passwords, API keys or provider credentials. The Google backend exposes `admin.status` and `admin.backup`, both guarded by the authenticated server role; hiding a navigation entry is not the access-control boundary. Connection checks verify resource access, not all sharing grants or deployment settings. That description applies to the Workspace edition. The new cloud edition provides domain-independent Supabase email/password authentication after configuration; see its deployment guide.

`people.js` renders the employee directory and owns its view/filter state. Its data selection uses the user's existing access scope and does not change business records. The current employee view is also available at `/#employees`.

## Test

```sh
node tests/core.test.cjs
node tests/operations.test.cjs
node tests/interface.test.cjs
node tests/data-admin.test.cjs
python3 scripts/package.py
```

The 48 workflow/operation checks cover approvals, authorisation, leave balances, overlap, onboarding versioning, payroll transitions, adjustment review and duplication, shift boundaries, renewals, hiring, offboarding date gates and rollback. Interface checks render all 20 pages in both languages and allowed pages across five roles, including report and modal states. These are automated rendering checks, not browser visual or end-to-end tests. Data administration checks use mocked Google services to verify admin-only APIs, snapshots, deduplication and failure handling. Live Workspace identity/scopes, PDF generation, sending and quotas must be tested in a disposable Workspace installation. Browser visual QA was unavailable in the build environment.

## Open-source use

Code is licensed under MIT. Replace the company name and logo when deploying your own instance; the licence does not grant rights to Zarqa's trademarks. No Fawry code, employee records or private interface assets are included. Public product materials and an authorised read-only review of Fawry's interface informed the feature structure; the design and implementation are original.

## Roadmap

- Normalized business tables, multi-company tenancy and organisational hierarchy editor.
- Country policy modules reviewed by qualified local advisers.
- Calendar and external attendance integrations.
- Expanded permission policies and configurable document retention.
- Background mail queue with provider receipts and retries after delivery reconciliation.
- In-app invitation/email-change management and additional external workflow integrations.

## بالعربي

زرقاء People تطبيق موارد بشرية بالعربية والإنجليزية، من إعلان الوظيفة لحد إنهاء الخدمة. نسخة العرض تحفظ بيانات تجريبية في المتصفح ولا ترسل إيميلات. الموظف يرفع مسوغات التعيين من البوابة وHR يراجعها من الواجهة؛ التخزين التجريبي داخل المتصفح والتخزين الفعلي في أرشيف Drive خاص لكل موظف. نسخة Google Workspace تحفظ السجلات في Sheets والمستندات في Drive، وتحتاج إعداد الصلاحيات وحساب الشركة قبل التشغيل الحقيقي. كل المستخدمين والأرقام في العرض غير حقيقيين. غيّر اسم الشركة وشعارها من الإعدادات، وراجع قواعد الرواتب والإجازات قبل الاستخدام الفعلي.

التحديث يضيف قائمة أقسام منظمة، بحثًا سريعًا، مركزًا لـ١٧ نوع طلب بمسارات موافقات قابلة للتعديل، مخطط شفتات أسبوعيًا، عقودًا وتنبيهات انتهاء، و١١ تقريرًا داخل الواجهة. تأثيرات الحضور والمصروفات والإضافي تُراجع قبل اعتماد المرتب. تسجيل الصرف منفصل عن إرسال كشف المرتب، ولا ينفذ تحويلًا بنكيًا. تحديث نسخة Google الحالية يتم باستبدال ملفات المشروع ونشر إصدار جديد بدون إعادة تشغيل `setup()`.

## Reference sources (reviewed 2026-10-14)

- Fawry public site: https://www.fawrypayday.com/
- Fawry HR help centre: https://helpcenter.fawrypayday.com/
- Apps Script identity: https://developers.google.com/apps-script/reference/base/session
- Installable triggers: https://developers.google.com/apps-script/guides/triggers/installable
- Country detection API: https://ipapi.co/api/
- Labour-law official links are declared in `dist/laws.js`.
