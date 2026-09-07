import type { DevVaultExport } from "../models/DevVaultExport";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isDevVaultExport(value: unknown): value is DevVaultExport {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.profile)) {
    return false;
  }

  const profile = value.profile;
  return (
    isNonEmptyString(profile.name) &&
    typeof profile.description === "string" &&
    Array.isArray(profile.extensions) &&
    profile.extensions.every(
      (extension: unknown) =>
        isRecord(extension) &&
        isNonEmptyString(extension.id) &&
        isNonEmptyString(extension.name) &&
        isNonEmptyString(extension.version),
    )
  );
}
