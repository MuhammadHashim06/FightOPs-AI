import type { CreateEventInput, EventStatus, UpdateEventInput } from "@/types/event";

const eventStatuses: EventStatus[] = ["draft", "upcoming", "active", "completed"];

export function validateCreateEventInput(input: CreateEventInput) {
  assertName(input.name);
  assertDate(input.date);
  assertLocation(input.location);
  if (typeof input.status !== "undefined") {
    assertStatus(input.status);
  }
  assertNote(input.note);
}

export function validateUpdateEventInput(input: UpdateEventInput) {
  if (typeof input.name !== "undefined") {
    assertName(input.name);
  }

  if (typeof input.date !== "undefined") {
    assertDate(input.date);
  }

  if (typeof input.location !== "undefined") {
    assertLocation(input.location);
  }

  if (typeof input.status !== "undefined") {
    assertStatus(input.status);
  }

  if (typeof input.note !== "undefined") {
    assertNote(input.note);
  }
}

function assertName(name: string) {
  if (!name.trim() || name.trim().length < 3) {
    throw new Error("Event name must be at least 3 characters.");
  }
}

function assertDate(date: string) {
  if (!date.trim()) {
    throw new Error("Event date is required.");
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("A valid event date is required.");
  }
}

function assertLocation(location: string) {
  if (!location.trim() || location.trim().length < 3) {
    throw new Error("Event location must be at least 3 characters.");
  }
}

function assertStatus(status: string) {
  if (!eventStatuses.includes(status as EventStatus)) {
    throw new Error("A valid event status is required.");
  }
}

function assertNote(note: string | undefined) {
  if (typeof note === "undefined") {
    return;
  }

  if (note.length > 1000) {
    throw new Error("Event note must be 1000 characters or less.");
  }
}
