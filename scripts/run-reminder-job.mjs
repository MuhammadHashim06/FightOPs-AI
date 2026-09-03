const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
const cronSecret = process.env.REMINDER_CRON_SECRET || "";

if (!appUrl || !cronSecret) {
  console.error(
    "Reminder job requires NEXT_PUBLIC_APP_URL and REMINDER_CRON_SECRET.",
  );
  process.exit(1);
}

const response = await fetch(`${appUrl}/api/v1/jobs/reminders`, {
  headers: {
    "x-cron-secret": cronSecret,
  },
});

const body = await response.text();

if (!response.ok) {
  console.error(`Reminder job failed (${response.status}): ${body}`);
  process.exit(1);
}

console.log(body);

