# AtomQuest

**In-House Goal Setting & Tracking Portal**  
Built for AtomQuest Hackathon 1.0 by Atomberg

**Live:** https://atomquest-indol.vercel.app  
**Repo:** https://github.com/arpitraj18/atomquest

---

## Overview

AtomQuest is a full-stack goal management portal that covers the complete OKR lifecycle — from goal creation and manager approval through quarterly check-ins, achievement reporting, escalation automation, and ML-based risk detection. It is built as a single Next.js codebase with no separate backend server and runs entirely on free-tier infrastructure.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.6 (App Router), React 19, Tailwind CSS v4, DM Sans |
| Backend | Next.js API Routes (TypeScript) |
| Database | PostgreSQL via Supabase |
| Auth | NextAuth.js v4 — JWT strategy, credentials provider |
| Email | Resend API |
| Notifications | Discord webhook (Teams adaptive card format) |
| Charts | Recharts |
| Deployment | Vercel (free tier) |
| Cron | Vercel Cron — daily escalation checks at 9 AM UTC |

Zero infrastructure cost — every component runs on a free tier.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Vercel Edge                      │
│                                                      │
│   ┌─────────────────────────────────────────────┐   │
│   │           Next.js Application               │   │
│   │                                             │   │
│   │  ┌──────────────┐   ┌───────────────────┐  │   │
│   │  │  App Router  │   │   API Routes      │  │   │
│   │  │  (React RSC) │   │  /api/goals       │  │   │
│   │  │              │   │  /api/checkins    │  │   │
│   │  │  /dashboard  │   │  /api/cycles      │  │   │
│   │  │  /goals      │   │  /api/users       │  │   │
│   │  │  /manager    │   │  /api/ml/*        │  │   │
│   │  │  /admin      │   │  /api/cron/*      │  │   │
│   │  │  /analytics  │   │  /api/escalations │  │   │
│   │  └──────────────┘   └────────┬──────────┘  │   │
│   │                              │              │   │
│   └──────────────────────────────┼─────────────┘   │
│                                  │                  │
│   ┌──────────────────────────────▼──────────────┐  │
│   │              Vercel Cron                     │  │
│   │         /api/cron/escalate (0 9 * * *)       │  │
│   └──────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
   ┌──────▼──────┐   ┌───────▼──────┐   ┌────────▼──────┐
   │  Supabase   │   │    Resend    │   │    Discord    │
   │ PostgreSQL  │   │    Email     │   │   Webhook     │
   │             │   │     API      │   │ (Teams compat)│
   │  users      │   │              │   │               │
   │  goals      │   │  submitted   │   │  goal events  │
   │  check_ins  │   │  approved    │   │  escalations  │
   │  cycles     │   │  returned    │   │  reminders    │
   │  audit_logs │   │  reminder    │   │               │
   │  escalations│   └──────────────┘   └───────────────┘
   └─────────────┘
```

**Key design decisions:**
- No separate backend server — all server logic lives in Next.js API routes
- JWT sessions — stateless, no server-side session storage
- Supabase handles DB-level audit log triggers
- ML features are entirely rule-based (no external ML library or API cost)

---

## Features

### Phase 1 — Goal Creation & Approval

- Employees create up to 8 goals per cycle across 7 thrust areas:
  - Revenue Growth, Cost Optimisation, Customer Experience, People & Culture, Operational Excellence, Innovation, Compliance & Risk
- Four unit of measurement types:
  - `min` — numeric, higher is better (score = actual ÷ target, capped at 100%)
  - `max` — numeric, lower is better (score = target ÷ actual, capped at 100%)
  - `timeline` — date-based (100% if completed on or before deadline, else 0%)
  - `zero` — zero = success (100% if actual = 0, else 0%)
- Validation enforced at both API and UI level:
  - Total weightage must equal exactly 100% before submission
  - Minimum 10% weightage per goal
  - Maximum 8 goals per employee per cycle
- Manager (L1) approval workflow with inline target and weightage editing before approval
- Goals lock on approval — edits require Admin intervention (unlock from Admin Panel → Goals tab)
- Returned goals: employee sees an edit button, revises, and resubmits in one flow
- **Shared goals:** Admin pushes a departmental KPI to multiple employees. Recipients can adjust their own weightage. When the primary owner logs a check-in, it syncs to all linked employee goal sheets automatically.

### Phase 2 — Achievement Tracking & Check-ins

- Quarterly check-in interface for employees (Q1–Q4)
- Status selection per goal: Not Started / On Track / Completed
- Check-in window enforcement based on cycle configuration in the database — active quarter auto-detected; inputs are disabled outside the active window
- Progress score shown in colour per goal: green (≥80%), amber (≥50%), red (<50%)
- **Manager check-in module:**
  - Grouped by employee with avatar initials
  - Planned vs. actual view per goal
  - Manager enters actual achievement and structured comment
  - Page defaults to the active quarter automatically
- Employee check-in page also defaults to the active quarter on load

### Reporting & Governance

- **Achievement Report** — full table of all employees, goals, and quarters with planned vs. actual and progress percentage
- **CSV export** — one-click download of the full dataset
- **Completion Dashboard** — real-time view per quarter showing which employees and managers have completed check-ins with overall completion percentage
- **Audit Trail** — every goal status change is logged with timestamp, change type, old and new status, and the name of who made the change (System for automated changes)

### Cycle Management

- Admin configures cycle dates from Admin Panel → Cycle Management
- Configurable dates: Phase 1 open, Q1–Q4 check-in window opens
- Active cycle toggle
- Current cycle: FY 2025–26 (Phase 1: May 2025, Q1: Jul 2025, Q2: Oct 2025, Q3: Jan 2026, Q4: Mar 2026)

### Notifications

**Email via Resend — 4 event types:**
- Goal submitted → manager receives email with deep link to Team Goals
- Goal approved → employee receives email with deep link to My Goals
- Goal returned → employee receives email with manager comment and deep link
- Check-in reminder → Admin sends batch reminder to all employees for any quarter

**Discord / Teams — 5 event types:**
- Goal submitted, approved, returned, check-in reminder, escalation triggered
- All notifications include deep links back to the relevant page
- Implemented via Discord webhook using Teams-compatible adaptive card payload (see note below)

### Escalations

Three configurable rule types (Admin Panel → Escalations):

| Rule | Description |
|---|---|
| `goal_not_submitted` | Employee has not submitted goals within N days of cycle open |
| `goal_not_approved` | Manager has not approved goals within N days of submission |
| `checkin_not_done` | Quarterly check-in not completed within the active window |

- Each rule has a configurable day threshold and an active/inactive toggle
- Vercel Cron runs escalations automatically every day at 9 AM UTC (`0 9 * * *`)
- Admin can also trigger escalations manually from the portal
- Deduplication: one escalation per goal per run
- Escalation log visible to Admin with timestamp and details

---

## Bonus — ML Features

### Goal Achievement Risk Predictor

Logistic regression applied per goal using check-in history. Shown as a risk badge inline on Manager → Team Goals, next to each approved goal.

**Features computed from check-in data:**
- `progress_rate` — average normalised score across all check-ins
- `trend` — linear slope of quarterly scores (positive = improving)
- `consistency_penalty` — standard deviation of scores + spike detection penalty
- `quarter_elapsed`, `weightage` — computed for display context

**Formula:**
```
logit = -1.5 + 3.0 × progress_rate + 2.0 × trend − 1.0 × consistency_penalty
probability = 1 / (1 + e^(−logit))
```

**Risk levels:**
| Badge | Condition |
|---|---|
| LOW (green) | probability ≥ 0.70 |
| MEDIUM (amber) | probability ≥ 0.40 |
| HIGH (red) | probability < 0.40 |

Explanation text is generated by rule-based templates — no external API calls or added cost.

### Anomaly Detection

Z-score normalisation across all employees on four behavioural metrics:

| Metric | Description |
|---|---|
| `avg_progress` | Average normalised score across all goals |
| `score_variance` | Variance in scores across quarters |
| `late_checkins` | Check-in submissions more than 120 days after the previous |
| `max_quarter_spike` | Largest single quarter-over-quarter score jump |

Any employee with a z-score exceeding ±2.0 on any metric is flagged as anomalous. Results appear in Admin → Analytics → AI Anomaly Detection with z-scores and a human-readable reason per flagged employee.

The seeded demo data includes Pattern C employees (Karan Shah, Sneha Reddy) who show near-zero Q1/Q2 progress followed by a 98–99% spike in Q3, causing them to be flagged consistently.

---

## Demo Data

Run `POST /api/seed` once after setup to populate 8 demo employees across Engineering, Sales, Marketing, and HR with realistic check-in histories.

| Pattern | Employees | Behaviour |
|---|---|---|
| A — On Track | Neha, Vikram, Ananya, Rohit | Steady Q1→Q3 progress, consistent improvement |
| B — At Risk | Priyanka, Arjun | Starts okay, declines in Q2/Q3 |
| C — Anomalous | Sneha, Karan | Low Q1/Q2, suspicious 98–99% spike in Q3 |

This makes analytics charts, risk badges, and anomaly detection meaningful from the start.

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Employee | employee@demo.com | employee@atomberg |
| Employee 2 | employee2@demo.com | employee@atomberg |
| Manager | manager@demo.com | manager@atomberg |
| Admin | admin@demo.com | admin@atomberg |
| Fresh Employee | test@demo.com | employee@atomberg |

Use `test@demo.com` to test the full goal creation flow from scratch. The login page shows all credentials inline and supports one-click sign-in via demo account cards.

---

## Role-Based Access Control

| Role | Accessible pages |
|---|---|
| Employee | `/dashboard/goals`, `/dashboard/goals/new`, `/dashboard/goals/checkin` |
| Manager | `/dashboard/manager`, `/dashboard/manager/checkin` |
| Admin | `/dashboard/admin/*`, `/dashboard/analytics`, `/dashboard/reports` |

Unauthorised access redirects to `/dashboard` automatically, enforced via the `useRequireRole` hook on every protected page.

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- A Supabase project (free tier)
- A Resend account for email (free tier)
- A Discord server with an incoming webhook for notifications

### 1. Clone and install

```bash
git clone https://github.com/arpitraj18/atomquest.git
cd atomquest
npm install
```

### 2. Set up environment variables

Create `.env.local` in the project root. Save it in **UTF-8 encoding without BOM** — Windows Notepad defaults to UTF-16 LE, which causes a `supabaseUrl is required` runtime error.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_SECRET=any_random_32_char_string
NEXTAUTH_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_your_key

# Notifications (Discord webhook — Teams-compatible payload)
TEAMS_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook

# Cron job protection
CRON_SECRET=any_secret_string
```

### 3. Set up the database

Run the SQL schema against your Supabase project. The schema creates: `users`, `goals`, `check_ins`, `cycles`, `audit_logs`, `escalations`, `escalation_rules`.

### 4. Create the demo user accounts

Insert the base accounts into your `users` table, then set `manager_id` on employee rows to the manager's `id`:

```sql
INSERT INTO users (name, email, role, department) VALUES
  ('Demo Employee',   'employee@demo.com',  'employee', 'Engineering'),
  ('Demo Employee 2', 'employee2@demo.com', 'employee', 'Sales'),
  ('Demo Manager',    'manager@demo.com',   'manager',  'Engineering'),
  ('Demo Admin',      'admin@demo.com',     'admin',    'Operations'),
  ('Test Employee',   'test@demo.com',      'employee', 'Engineering');
```

### 5. Seed demo data

```bash
npm run dev
curl -X POST http://localhost:3000/api/seed
```

Expected: `{"success":true,"inserted":{"users":8,"goals":18,"checkIns":54}}`

The seed endpoint is idempotent — safe to run multiple times.

### 6. Open

```
http://localhost:3000
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key — server-side only, never exposed to client |
| `NEXTAUTH_SECRET` | Yes | Random string used to sign JWT sessions |
| `NEXTAUTH_URL` | Yes | Full base URL of the deployment (`http://localhost:3000` locally) |
| `RESEND_API_KEY` | Yes | API key from resend.com for transactional email |
| `TEAMS_WEBHOOK_URL` | No | Discord (or Teams) incoming webhook URL for notifications |
| `CRON_SECRET` | No | Bearer token checked by `/api/cron/escalate` to prevent unauthorised triggers |

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in Vercel
3. Add all environment variables in project settings
4. Set `NEXTAUTH_URL` to your Vercel deployment URL
5. The cron job (`0 9 * * *` → `/api/cron/escalate`) is defined in `vercel.json` and activates automatically on deploy

---

## A Note on Teams vs Discord

The problem statement asks for Microsoft Teams notifications. Microsoft Teams requires a paid Azure subscription to register incoming webhooks in most modern tenants. This project sends notifications using Discord webhooks with the Teams adaptive card payload format — the request structure and card schema are identical. To switch to real Teams webhooks, replace `TEAMS_WEBHOOK_URL` with a Teams incoming webhook URL. No code changes are required.

---

## Project Structure

```
atomquest/
├── app/
│   ├── page.tsx                      # Login page
│   ├── dashboard/
│   │   ├── page.tsx                  # Role-aware dashboard home
│   │   ├── goals/                    # Employee goal management
│   │   │   ├── page.tsx              # Goal list + submit
│   │   │   ├── new/page.tsx          # Create goal
│   │   │   ├── checkin/page.tsx      # Employee check-in
│   │   │   └── [id]/edit/page.tsx    # Edit returned goal
│   │   ├── manager/
│   │   │   ├── page.tsx              # Approve / return goals + risk badges
│   │   │   └── checkin/page.tsx      # Manager check-in module
│   │   ├── admin/
│   │   │   ├── page.tsx              # Admin panel (overview, audit, goals)
│   │   │   ├── cycles/page.tsx       # Cycle date management
│   │   │   ├── escalations/page.tsx  # Escalation rules
│   │   │   ├── completion/page.tsx   # Check-in completion dashboard
│   │   │   └── shared/page.tsx       # Push shared goals
│   │   ├── analytics/page.tsx        # Charts + anomaly detection
│   │   └── reports/page.tsx          # Achievement report + CSV export
│   └── api/
│       ├── goals/                    # Goal CRUD
│       ├── checkins/                 # Check-in CRUD
│       ├── cycles/                   # Cycle configuration
│       ├── users/                    # User lookup
│       ├── audit/                    # Audit log retrieval
│       ├── escalations/              # Rules + log
│       ├── shared-goals/             # Shared goal push
│       ├── notify/remind/            # Batch reminder trigger
│       ├── cron/escalate/            # Daily escalation runner
│       ├── seed/                     # Demo data seeder
│       └── ml/
│           ├── predict/              # Logistic regression risk scoring
│           └── anomalies/            # Z-score anomaly detection
├── lib/
│   ├── auth.ts                       # NextAuth config + role-based passwords
│   ├── auth-check.ts                 # useRequireRole client hook
│   ├── email.ts                      # Resend email helpers
│   ├── teams.ts                      # Discord/Teams notification helpers
│   ├── scoring.ts                    # UoM score computation
│   ├── supabase.ts                   # Supabase browser client
│   └── supabase-server.ts            # Supabase admin client (server-only)
├── components/
│   ├── Navbar.tsx
│   ├── ThemeProvider.tsx
│   └── Toast.tsx
└── vercel.json                       # Cron schedule definition
```

---

## Known Limitations

- **Azure AD SSO** — not implemented. Would require Azure tenant app registration credentials (`AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`) and adding `AzureADProvider` to `lib/auth.ts`.
- **Demo email inboxes** — `employee@demo.com` etc. are not real inboxes. Resend delivers correctly but the messages bounce silently. Verified working by testing with a real Gmail address during development.
- **Teams notifications** — delivered via Discord webhook with identical payload format (see note above).
- **Trackpad swipe-back navigation** — causes a brief session rehydration delay (~800ms) on some browsers. Known Next.js + NextAuth JWT behaviour, mitigated with skeleton loaders.
- **Old Resend API key** — accidentally committed in an early commit, immediately revoked, and replaced.

---

Built by Arpit Raj — AtomQuest Hackathon 1.0, Atomberg
