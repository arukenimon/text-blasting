# 📱 Text Blasting

A full-stack SMS campaign management platform for creating, scheduling, and tracking bulk text message campaigns. Built with Next.js, Supabase, and Tailwind CSS.

## Features

### 📊 Dashboard
- Real-time overview of key metrics — messages sent, delivery rate, reply rate, and opt-out rate
- Campaign performance table with delivery progress bars and status badges
- Quick Send panel for ad-hoc messaging
- Workspace switcher and sending-health signal for gateway, delivery, and audience quality
- Activity feed for recent events
- Compliance health score

### 📣 Campaign Management
- Create and schedule SMS campaigns for full audience segments or selected contacts
- Compose campaigns from approved templates or one-off custom messages
- Track delivery metrics per campaign (sent, delivered, replies, opt-outs)
- Campaign statuses: Draft, Scheduled, Running, Completed, Paused, Failed

### 👥 Audience Management
- Create audience segments with custom names, descriptions, and color labels
- Add individual contacts or import contact lists into a selected segment
- Bulk select contacts to move, delete, or launch a selected-contact campaign
- Contact status tracking: Subscribed, Opted Out, Undeliverable

### 📝 Template Builder
- Create reusable SMS templates with variable support (`{{first_name}}`, `{{promo_code}}`, etc.)
- Template categories: Promotional, Transactional, Re-engagement, Welcome, Alert
- Live phone preview with character counter (160 char SMS limit)
- Approval workflow: Approved, Pending, Rejected

### ⚙️ Settings
- **Workspace** — Rename the active workspace, invite team members, resend/cancel invites, and manage roles or removals
- **Security** — Change password with validation
- **SMS Gateway** — Configure workspace-scoped local or cloud SMS gateway credentials

### 🔗 Webhook System
- Receives real-time delivery events from the SMS gateway (sent, delivered, failed, received, etc.)
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
| SMS Gateway | sms-gate.app (cloud) / Local device gateway |

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop
- Supabase CLI
- SMS Gateway credentials (cloud or local)

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

NEXT_PUBLIC_SITE_URL=<your-site-url>
WEBHOOK_BASE_URL=<your-public-webhook-base-url>
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
- Set the Supabase Site URL to `NEXT_PUBLIC_SITE_URL`.
- Set `WEBHOOK_BASE_URL` to the public app origin used for generated webhook URLs.
- Add allowed redirect URLs for `/auth/confirm`, `/reset-password`, `/invite/**`, `/admin/**`, and local development URLs such as `http://127.0.0.1:3000/**`.
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

## SMS Gateway Modes

| Mode | Description |
|------|-------------|
| **Cloud** | Sends SMS via `api.sms-gate.app` managed service |
| **Local** | Sends SMS through a local device acting as an SMS gateway on your network |

Both modes support webhook events for delivery tracking and inbound message handling.

## License

This project is for personal/educational use.
