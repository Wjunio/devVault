import type * as vscode from "vscode";
import type { FavoriteExtension } from "../models/FavoriteExtension";

export class FavoritesService {
  constructor(private readonly state: vscode.Memento) {}

  getAll(): FavoriteExtension[] {
    return this.state.get<FavoriteExtension[]>("favorites", []);
  }

  save(favorites: FavoriteExtension[]): Thenable<void> {
    return this.state.update("favorites", favorites);
  }
}
