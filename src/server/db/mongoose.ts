import mongoose from "mongoose";

import { env } from "@/server/config/env";

declare global {
  var __mongooseConnection:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const globalCache = global.__mongooseConnection ?? {
  conn: null,
  promise: null,
};

global.__mongooseConnection = globalCache;

export async function connectToDatabase() {
  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(env.databaseUrl, {
      dbName: env.databaseName,
    });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}
