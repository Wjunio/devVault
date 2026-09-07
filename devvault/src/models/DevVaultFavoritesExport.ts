import type { FavoriteExtension } from "./FavoriteExtension";

export interface DevVaultFavoritesExport {
  version: number;
  type: "favorites";
  extensions: FavoriteExtension[];
}
