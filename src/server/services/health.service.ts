import { env } from "@/server/config/env";

export function getHealthStatus() {
  return {
    name: env.appName,
    version: env.apiVersion,
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
