import { unauthorized, ok, serverError } from "@/lib/api/response";
import { env } from "@/server/config/env";
import { sendDueRemindersForAllEvents } from "@/server/services/reminders.service";

export async function GET(request: Request) {
  return runReminderJob(request);
}

export async function POST(request: Request) {
  return runReminderJob(request);
}

async function runReminderJob(request: Request) {
  if (!env.reminderCronSecret) {
    return unauthorized("Reminder scheduler is not configured.");
  }

  if (!hasValidCronSecret(request)) {
    return unauthorized();
  }

  try {
    return ok({
      status: "completed",
      ...(await sendDueRemindersForAllEvents()),
    });
  } catch {
    return serverError("Unable to process reminder queue.");
  }
}

function hasValidCronSecret(request: Request) {
  const authorization = request.headers.get("authorization");
  const bearerSecret = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
  const headerSecret = request.headers.get("x-cron-secret")?.trim() ?? null;

  return bearerSecret === env.reminderCronSecret || headerSecret === env.reminderCronSecret;
}
