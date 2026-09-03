# Reminder Job

Reminder emails are processed by a protected job endpoint. This project
includes a Vercel Cron schedule for every day at `19:00 UTC`, which is
`00:00 Asia/Karachi`.

## Required environment

```env
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
REMINDER_CRON_SECRET=use-a-long-random-secret
CRON_SECRET=use-the-same-long-random-secret
```

## Run manually

```bash
npm run job:reminders
```

The command calls:

```text
POST /api/v1/jobs/reminders
```

with `REMINDER_CRON_SECRET` as the protected `x-cron-secret` header. A
successful response includes the number of requirements processed, emails sent,
and failed deliveries.

## Schedule

Vercel reads the schedule from `vercel.json` and automatically sends
`Authorization: Bearer <CRON_SECRET>`. The API also accepts
`REMINDER_CRON_SECRET` for the manual runner and external cron providers.
The worker is safe to run repeatedly: requirements are claimed briefly before
processing, resolved requirements are excluded, and failed sends use bounded
retries.

Before going live, add the production SMTP values and the same random secret to
the deployment environment. The application cannot provide those credentials
from source control.
