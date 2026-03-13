import { Platform } from "@/features/ai/types";

export function normalizePlatformValue(value: unknown): Platform | undefined {
  if (typeof value !== "string") return undefined;

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (normalized === "x" || normalized.includes("twitter")) {
    return Platform.X;
  }

  if (normalized.includes("linkedin")) {
    return Platform.LINKEDIN;
  }

  if (normalized === "ig" || normalized.includes("instagram")) {
    return Platform.INSTAGRAM;
  }

  if (normalized.includes("tik tok") || normalized.includes("tiktok")) {
    return Platform.TIKTOK;
  }

  if (normalized === "yt" || normalized.includes("youtube")) {
    return Platform.YOUTUBE;
  }

  if (normalized.includes("e mail") || normalized.includes("email")) {
    return Platform.EMAIL;
  }

  if (normalized.includes("generic") || normalized.includes("general")) {
    return Platform.GENERIC;
  }

  // Map platforms that aren't first-class in our enum to GENERIC
  // so AI-generated values like "Discord", "Threads", "Reddit", "Pinterest" etc.
  // don't break schema validation
  return Platform.GENERIC;
}

export function normalizePlatformFields<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => normalizePlatformFields(item)) as T;
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  const normalizedEntries = Object.entries(value).map(([key, entryValue]) => {
    if (key === "platform" || key === "targetPlatform") {
      return [key, normalizePlatformValue(entryValue) ?? entryValue];
    }

    if (key === "platforms" && Array.isArray(entryValue)) {
      return [
        key,
        entryValue.map((item) => normalizePlatformValue(item) ?? item),
      ];
    }

    return [key, normalizePlatformFields(entryValue)];
  });

  return Object.fromEntries(normalizedEntries) as T;
}
