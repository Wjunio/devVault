import * as vscode from "vscode";
import type { FavoritesService } from "../services/favoritesService";

export function showFavorites(favoritesService: FavoritesService): void {
  const favorites = favoritesService.getAll();

  if (favorites.length === 0) {
    vscode.window.showInformationMessage(
      "Você ainda não possui extensões favoritas.",
    );

    return;
  }

  const output = vscode.window.createOutputChannel("DevVault");

  output.clear();

  output.appendLine("========================================");
  output.appendLine("          ⭐ MEU DEVVAULT");
  output.appendLine("           Extensões favoritas");
  output.appendLine("========================================");
  output.appendLine("");

  favorites.forEach((extension, index) => {
    output.appendLine(`${index + 1}. ⭐ ${extension.name}`);
    output.appendLine(`   ID: ${extension.id}`);
    output.appendLine(`   Versão salva: ${extension.version}`);
    output.appendLine("");
  });

  output.appendLine(`Total: ${favorites.length} favoritas`);

  output.show();
}
