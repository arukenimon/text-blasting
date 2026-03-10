# 📱 Text Blasting

A full-stack SMS campaign management platform for creating, scheduling, and tracking bulk text message campaigns. Built with Next.js, Supabase, and Tailwind CSS.

## Features

### 📊 Dashboard
- Real-time overview of key metrics — messages sent, delivery rate, reply rate, and opt-out rate
- Campaign performance table with delivery progress bars and status badges
- Quick Send panel for ad-hoc messaging
- Activity feed for recent events
- Compliance health score

### 📣 Campaign Management
- Create and schedule SMS campaigns linked to audience segments and templates
- Track delivery metrics per campaign (sent, delivered, replies, opt-outs)
- Campaign statuses: Draft, Scheduled, Running, Completed, Paused

### 👥 Audience Management
- Create audience segments with custom names, descriptions, and color labels
- Add individual contacts with phone number and segment assignment
- Contact status tracking: Subscribed, Opted Out, Undeliverable

### 📝 Template Builder
- Create reusable SMS templates with variable support (`{{first_name}}`, `{{promo_code}}`, etc.)
- Template categories: Promotional, Transactional, Re-engagement, Welcome, Alert
- Live phone preview with character counter (160 char SMS limit)
- Approval workflow: Approved, Pending, Rejected

### ⚙️ Settings
- **Security** — Change password with validation
- **SMS Gateway** — Configure local (on-device) or cloud-based SMS gateway credentials

### 🔗 Webhook System
- Receives real-time delivery events from the SMS gateway (sent, delivered, failed, received, etc.)
- HMAC-SHA256 signature verification with replay protection
- Auto-registers webhooks when gateway credentials are saved

### 🔐 Authentication
- Email/password authentication via Supabase Auth
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
- A [Supabase](https://supabase.com) project
- SMS Gateway credentials (cloud or local)

### Installation

```bash
git clone https://github.com/<your-username>/text-blasting.git
cd text-blasting
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

WEBHOOK_URL=<your-webhook-endpoint>
WEBHOOK_SECRET=<your-webhook-secret>

SMS_GATEWAY_USERNAME=<cloud-gateway-username>
SMS_GATEWAY_PASSWORD=<cloud-gateway-password>

LOCAL_SERVER_URL=<local-device-ip:port>
LOCAL_API_USERNAME=<local-username>
LOCAL_API_PASSWORD=<local-password>
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── admin/
│   ├── audience/      # Audience segments & contacts
│   ├── campaigns/     # Campaign management
│   ├── dashboard/     # Overview dashboard
│   ├── settings/      # Security & gateway config
│   └── templates/     # SMS template builder
├── api/
│   ├── send-sms/      # SMS sending endpoint
│   ├── webhook/       # Inbound webhook handler
│   ├── register_webhook/
│   ├── list-webhooks/
│   └── delete_webhook/
├── components/        # Shared app components
│   └── dashboard/     # Dashboard-specific components
├── login/             # Login page
└── layout.tsx         # Root layout
components/ui/         # shadcn/ui components
lib/supabase/          # Supabase client & server helpers
supabase/migrations/   # Database migrations
```

## SMS Gateway Modes

| Mode | Description |
|------|-------------|
| **Cloud** | Sends SMS via `api.sms-gate.app` managed service |
| **Local** | Sends SMS through a local device acting as an SMS gateway on your network |

Both modes support webhook events for delivery tracking and inbound message handling.

## License

This project is for personal/educational use.
