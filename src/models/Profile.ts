import type { FavoriteExtension } from "./FavoriteExtension";

export interface Profile {
  name: string;
  description: string;
  extensions: FavoriteExtension[];
}
