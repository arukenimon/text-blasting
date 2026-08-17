# Production domain migration

The current canonical production origin is `https://relaycampaigns.vercel.app`.

## 1. Vercel environment

Set these variables for the **Production** environment and redeploy:

```env
NEXT_PUBLIC_SITE_URL=https://relaycampaigns.vercel.app
WEBHOOK_BASE_URL=https://relaycampaigns.vercel.app
GOOGLE_SITE_VERIFICATION=<optional-verification-token>
```

`GOOGLE_SITE_VERIFICATION` should contain only the token from the Search Console meta tag. The existing HTML verification file at `/googleeb1ae8497fc9ebad.html` remains supported as an alternative.

If an older hostname is already public, keep it attached long enough to permanently redirect every old path and query string to the matching URL on `relaycampaigns.vercel.app`. Prefer a Vercel domain redirect. Do not redirect every old URL to the homepage.

## 2. Supabase Auth

In **Authentication > URL Configuration** in the hosted Supabase project:

- Set **Site URL** to `https://relaycampaigns.vercel.app`.
- Add `https://relaycampaigns.vercel.app/**` to **Redirect URLs**. The app generates confirmation, recovery, invite, and post-login destinations under this origin.
- Keep `http://127.0.0.1:3000/**` and any required preview URL patterns as separate development entries.
- Remove the old production origin only after old confirmation, recovery, and invitation emails have expired.

Update the hosted Auth email subjects and bodies to match `supabase/config.toml` and `supabase/templates/*`; repository changes do not automatically update dashboard-managed templates.

If a social OAuth provider is enabled later, its provider callback normally remains the Supabase callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`). Also review that provider's allowed website origins and application homepage.

## 3. SMS Gate webhooks and scheduler

Changing `WEBHOOK_BASE_URL` affects newly generated webhook URLs only. After the redeploy:

1. Open **Settings > SMS Gate** in each workspace.
2. Re-register webhooks so SMS Gate replaces the old callback origin with `https://relaycampaigns.vercel.app/api/webhooks/<token>`.
3. Confirm delivery events reach the reports view.

Update any external cron or VPS scheduler to call:

```text
https://relaycampaigns.vercel.app/api/cron/dispatch
```

Keep the existing `CRON_SECRET`; only the endpoint origin changes.

## 4. Google Search Console

1. Add the URL-prefix property `https://relaycampaigns.vercel.app/` and verify ownership using the deployed HTML file or the metadata token.
2. Submit `https://relaycampaigns.vercel.app/sitemap.xml`.
3. Inspect `https://relaycampaigns.vercel.app/` and request indexing after the deployment.
4. Confirm `robots.txt`, the sitemap, the canonical link, and the social image all use the production origin.
5. If the old site was indexed, verify both properties, keep path-preserving permanent redirects active, and submit Search Console's Change of Address for the old property.

When `relaycampaigns.com` is purchased, repeat this checklist, make that domain canonical, and redirect both the old Vercel hostname and any other public aliases to one preferred host.
