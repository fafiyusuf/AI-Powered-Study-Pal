import { betterAuth, string } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

function sanitizeOrigin(origin: string): string | null {
  const trimmed = origin.trim();
  if (!trimmed) return null;
  // Ensure it starts with http/https and remove trailing slash
  const hasScheme = /^https?:\/\//i.test(trimmed);
  if (!hasScheme) return null;
  return trimmed.replace(/\/$/, "");
}

function parseTrustedOrigins(): string[] {
  const raw = process.env.TRUSTED_ORIGINS || process.env.CLIENT_URL || "";
  const parts = raw.split(",");
  const origins = parts
    .map((p) => sanitizeOrigin(p))
    .filter((v): v is string => Boolean(v));
  return Array.from(new Set(origins));
}

export const trustedOrigins = parseTrustedOrigins();

