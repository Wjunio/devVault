import * as vscode from "vscode";
import type { DevVaultFavoritesExport } from "../models/DevVaultFavoritesExport";
import type { FavoritesService } from "../services/favoritesService";

export async function exportFavorites(favoritesService: FavoritesService): Promise<void> {
  try {
    const favorites = favoritesService.getAll();
    if (favorites.length === 0) {
      vscode.window.showInformationMessage("Você ainda não possui nenhuma extensão favorita para exportar.");
      return;
    }
    const uri = await vscode.window.showSaveDialog({
      title: "📤 DevVault — Exportar favoritos",
      defaultUri: vscode.Uri.file("devvault-favorites.devvault.json"),
      filters: { JSON: ["json"] },
    });
    if (!uri) {
      return;
    }
    const data: DevVaultFavoritesExport = { version: 1, type: "favorites", extensions: favorites };
    await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(data, null, 2), "utf-8"));
    vscode.window.showInformationMessage(`📤 ${favorites.length} favoritos exportados com sucesso.`);
  } catch (error) {
    console.error("Erro ao exportar favoritos DevVault:", error);
    vscode.window.showErrorMessage("Não foi possível exportar os favoritos. Verifique o local escolhido e a permissão de escrita.");
  }
}
