import type { DevVaultFavoritesExport } from "../models/DevVaultFavoritesExport";
import { isDevVaultExport } from "./isDevVaultExport";

export function isDevVaultFavoritesExport(value: unknown): value is DevVaultFavoritesExport {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const data = value as Record<string, unknown>;
  return data.type === "favorites" && isDevVaultExport({
    version: data.version,
    profile: { name: "favorites", description: "", extensions: data.extensions },
  });
}
