import type { CreateEventInput, EventRecord, UpdateEventInput } from "@/types/event";
import { connectToDatabase } from "@/server/db/mongoose";
import { EventMongoModel } from "@/server/models/event.model";
import { FightMongoModel } from "@/server/models/fight.model";

type EventSummaryMetrics = {
  fights: number;
  fighters: number;
};

export const eventsRepository = {
  async listEvents() {
    await connectToDatabase();

    const events = await EventMongoModel.find().sort({ date: 1, createdAt: -1 }).lean();
    return events.map(mapEvent);
  },
  async findEventById(eventId: string) {
    await connectToDatabase();

    const event = await EventMongoModel.findById(eventId).lean();
    return event ? mapEvent(event) : null;
  },
  async findEventBySlug(slug: string) {
    await connectToDatabase();

    const event = await EventMongoModel.findOne({ slug }).lean();
    return event ? mapEvent(event) : null;
  },
  async createEvent(input: CreateEventInput & { createdByUserId: string; slug: string }) {
    await connectToDatabase();

    const event = await EventMongoModel.create({
      slug: input.slug,
      createdByUserId: input.createdByUserId,
      name: input.name,
      date: input.date,
      location: input.location,
      status: input.status,
      note: normalizeOptionalText(input.note),
    });

    return mapEvent(event.toObject());
  },
  async updateEvent(eventId: string, input: UpdateEventInput & { slug?: string }) {
    await connectToDatabase();

    const updatePayload: Record<string, unknown> = {};

    if (typeof input.name === "string") {
      updatePayload.name = input.name;
    }

    if (typeof input.slug === "string") {
      updatePayload.slug = input.slug;
    }

    if (typeof input.date === "string") {
      updatePayload.date = input.date;
    }

    if (typeof input.location === "string") {
      updatePayload.location = input.location;
    }

    if (typeof input.status === "string") {
      updatePayload.status = input.status;
    }

    if (typeof input.note !== "undefined") {
      updatePayload.note = normalizeOptionalText(input.note);
    }

    const event = await EventMongoModel.findByIdAndUpdate(eventId, updatePayload, {
      new: true,
      runValidators: true,
    }).lean();

    return event ? mapEvent(event) : null;
  },
  async deleteEvent(eventId: string) {
    await connectToDatabase();
    const result = await EventMongoModel.findByIdAndDelete(eventId).lean();
    return Boolean(result);
  },
  async getEventSummaryMetrics(eventId: string): Promise<EventSummaryMetrics> {
    await connectToDatabase();

    const fights = await FightMongoModel.find({ eventId })
      .select({ fighterAId: 1, fighterBId: 1 })
      .lean();

    const fighterIds = new Set<string>();

    for (const fight of fights) {
      if (fight.fighterAId) {
        fighterIds.add(fight.fighterAId.toString());
      }

      if (fight.fighterBId) {
        fighterIds.add(fight.fighterBId.toString());
      }
    }

    return {
      fights: fights.length,
      fighters: fighterIds.size,
    };
  },
};

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function mapEvent(event: {
  _id: { toString(): string };
  slug: string;
  createdByUserId: { toString(): string };
  name: string;
  date: Date;
  location: string;
  status: EventRecord["status"];
  note?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): EventRecord {
  return {
    id: event._id.toString(),
    slug: event.slug,
    createdByUserId: event.createdByUserId.toString(),
    name: event.name,
    date: event.date.toISOString(),
    location: event.location,
    status: event.status,
    note: event.note ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}
