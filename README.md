# 📱 Relay Campaigns

An independent full-stack project exploring how a team campaign dashboard can make [SMS Gate](https://sms-gate.app/) more useful for recurring outbound messaging. The production app is [relaycampaigns.vercel.app](https://relaycampaigns.vercel.app/). Built with Next.js, Supabase, and Tailwind CSS.

> **Project status:** Relay Campaigns is a project preview, not an SMS carrier or a replacement for SMS Gate. Sending requires an Android device running [SMS Gateway for Android](https://docs.sms-gate.app/getting-started/), an SMS Gate cloud setup, and the corresponding API credentials.

## Features

### 📊 Dashboard
- Real-time overview of messages sent, delivery rate, failed messages, and opt-out rate
- Campaign performance table with delivery progress bars and status badges
- Quick Send panel for ad-hoc messaging
- Workspace switcher and sending-health signal for gateway, delivery, and audience quality

### 📣 Campaign Management
- Create and schedule SMS campaigns for full audience segments or selected contacts
- Compose campaigns from reusable templates or one-off custom messages
- Track sent, delivered, queued, and failed message totals per campaign
- Campaign statuses: Draft, Scheduled, Running, Completed, Paused, Failed

### 👥 Audience Management
- Create audience segments with custom names, descriptions, and color labels
- Add individual contacts or import contact lists into a selected segment
- Bulk select contacts to move, delete, or launch a selected-contact campaign
- Contact status tracking: Subscribed, Opted Out, Undeliverable

### 📝 Template Builder
- Create reusable SMS templates with `{{full_name}}` personalization
- Template categories: Promotional, Transactional, Re-engagement, Welcome, Alert
- Live phone preview with character counter (160 char SMS limit)

### ⚙️ Settings
- **Workspace** — Rename the active workspace, invite team members, resend/cancel invites, and manage roles or removals
- **Security** — Change password with validation
- **SMS Gate** — Configure workspace-scoped credentials for the public SMS Gate cloud API

### 🔗 Webhook System
- Receives real-time outbound delivery events from SMS Gate (sent, delivered, and failed)
- HMAC-SHA256 signature verification with replay protection
- Auto-registers webhooks when gateway credentials are saved
- Sending-health endpoint summarizes gateway availability, recent delivery results, and audience quality

### 🔐 Authentication
- Email/password authentication via Supabase Auth
- Email verification, password recovery, magic links, and team invites use Supabase Auth email templates with token-hash verification
- Invite acceptance and completion flows support both existing users and newly invited users
- Middleware-based route protection with automatic redirects

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | Tailwind CSS 4, shadcn/ui, Lucide Icons |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + SSR |
| State | TanStack React Query |
| Validation | Zod |
| SMS delivery layer | [SMS Gate cloud API](https://docs.sms-gate.app/integration/api/) + SMS Gateway for Android |

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop
- Supabase CLI
- An Android device running SMS Gateway for Android
- SMS Gate cloud credentials from the app's Cloud server section

### Installation

```bash
git clone https://github.com/<your-username>/text-blasting.git
cd text-blasting
npm install
```

### Local Supabase With Docker

Start the local Supabase stack:

```bash
npm run supabase:start
```

Copy `.env.local.example` to `.env.local`, then replace the anon and service-role keys with the values printed by:

```bash
npm run supabase:status
```

Apply migrations from a clean local database:

```bash
npm run supabase:reset
```

Supabase Studio will be available at [http://127.0.0.1:56323](http://127.0.0.1:56323). The app expects Supabase API at `http://127.0.0.1:56321`.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

NEXT_PUBLIC_SITE_URL=https://relaycampaigns.vercel.app
WEBHOOK_BASE_URL=https://relaycampaigns.vercel.app
GOOGLE_SITE_VERIFICATION=<optional-search-console-token>
WEBHOOK_SECRET=<your-webhook-secret>

SMS_GATEWAY_USERNAME=<cloud-gateway-username>
SMS_GATEWAY_PASSWORD=<cloud-gateway-password>

LOCAL_SERVER_URL=<local-device-ip:port>
LOCAL_API_USERNAME=<local-username>
LOCAL_API_PASSWORD=<local-password>
```

### Production Auth Email

Configure production Auth email delivery in the Supabase dashboard, not through client-side app code:

- Enable email confirmations in Authentication > Providers > Email.
- Configure custom SMTP with Brevo:
  - Host: `smtp-relay.brevo.com`
  - Port: `587`
  - User: Brevo SMTP login
  - Password: Brevo SMTP key, not an API key
  - Sender: a verified auth sender such as `no-reply@your-domain`
- Set the Supabase Site URL to `https://relaycampaigns.vercel.app`.
- Set `WEBHOOK_BASE_URL` to the public app origin used for generated webhook URLs.
- Add `https://relaycampaigns.vercel.app/**` to the Supabase Auth redirect allowlist. Keep local development URLs such as `http://127.0.0.1:3000/**` separately.
- Match hosted Supabase email templates to `supabase/templates/*`, which route token-hash links through `/auth/confirm`.
- Disable Brevo click/link tracking for auth emails if it rewrites links.

### Run Development Server

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.

## Project Structure

```
app/
├── admin/
│   ├── audience/      # Audience segments & contacts
│   ├── campaigns/     # Campaign management
│   ├── dashboard/     # Overview dashboard
│   ├── settings/      # Security & gateway config
│   ├── templates/     # SMS template builder
│   └── workspaces/    # Workspace switching, invites, and team actions
├── api/
│   ├── campaigns/     # Campaign dispatch endpoints
│   ├── cron/          # Scheduled dispatch endpoint
│   ├── send-sms/      # Direct SMS sending endpoint
│   ├── sending-health/
│   ├── webhooks/      # Inbound webhook handlers
│   ├── register-webhooks/
│   ├── list-webhooks/
│   └── delete-webhooks/
├── auth/              # Supabase callback, confirm, success, and error routes
├── components/        # Shared app components
│   └── dashboard/     # Dashboard-specific components
├── forgot-password/   # Password recovery entry point
├── invite/            # Workspace invite acceptance/completion
├── login/             # Login page
├── reset-password/    # Password reset form/actions
└── layout.tsx         # Root layout
components/ui/         # shadcn/ui components
lib/auth/              # Auth and request-origin helpers
lib/sms-gateway/       # SMS gateway clients, events, and webhooks
lib/supabase/          # Supabase client & server helpers
supabase/migrations/   # Database migrations
supabase/templates/    # Supabase Auth email templates
```

## SMS Gate Integration

Relay Campaigns connects to the public API at `api.sms-gate.app`. Workspace owners provide credentials from SMS Gateway for Android, and the project uses SMS Gate to queue messages, check sender-device availability, and receive webhooks that update outbound delivery status.

SMS Gate and the connected Android device are responsible for actual SMS transport. Relay Campaigns supplies the higher-level workflow around contacts, segments, reusable templates, scheduling, team access, and reports.

See [docs/domain-migration.md](docs/domain-migration.md) before changing the production hostname.

## License

This project is for personal/educational use.
