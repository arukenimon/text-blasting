# VPS Scheduler

The production app can stay on Vercel while a VPS acts only as the scheduler.
The VPS should call the protected cron endpoint once per minute:

```text
POST https://relaycampaigns.vercel.app/api/cron/dispatch
Authorization: Bearer <CRON_SECRET>
```

This is lightweight. The endpoint performs one indexed lookup for due scheduled
campaigns and the send route atomically claims each campaign before sending, so
overlapping calls should not double-send.

## Recommended: host cron

Use normal Linux cron when the VPS is already maintained and you only need this
one scheduled trigger.

```bash
crontab -e
```

Add:

```cron
* * * * * curl -fsS --retry 2 --retry-delay 5 --max-time 55 -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" "https://relaycampaigns.vercel.app/api/cron/dispatch" >> /var/log/text-blasting-scheduler.log 2>&1
```

Make sure the same `CRON_SECRET` value is configured in Vercel.

## Optional: Docker Compose

Use Docker if you prefer the scheduler to be a named, restartable service with
container logs.

```bash
cd deploy/vps-scheduler
cp .env.example .env
docker compose up -d
docker compose logs -f scheduler
```

Docker is not required for this job. Host cron is simpler; Docker is nicer when
you already run VPS services through Compose.
