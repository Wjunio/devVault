import * as vscode from "vscode";
import type { FavoriteExtension } from "../models/FavoriteExtension";
import type { FavoritesService } from "../services/favoritesService";

interface ExtensionQuickPickItem extends vscode.QuickPickItem {
  extension: vscode.Extension<any>;
}

export async function manageFavorites(favoritesService: FavoritesService): Promise<void> {
  const extensions = vscode.extensions.all.filter(
    (extension) => !extension.id.startsWith("vscode."),
  );

  const savedFavorites = favoritesService.getAll();

  const favoriteIds = new Set(
    savedFavorites.map((extension) => extension.id),
  );

  const quickPick = vscode.window.createQuickPick<ExtensionQuickPickItem>();

  quickPick.title = "⭐ DevVault — Gerenciar favoritos";

  quickPick.placeholder = "Selecione suas extensões favoritas";

  quickPick.canSelectMany = true;

  const extensionItems: ExtensionQuickPickItem[] = extensions.map(
    (extension) => {
      const packageJSON = extension.packageJSON;

      return {
        label: packageJSON.displayName || packageJSON.name,
        description: `Versão ${packageJSON.version}`,
        detail: extension.id,
        extension,
      };
    },
  );

  quickPick.items = extensionItems;

  quickPick.selectedItems = extensionItems.filter((item) =>
    favoriteIds.has(item.extension.id),
  );

  quickPick.onDidAccept(async () => {
    const favorites: FavoriteExtension[] = quickPick.selectedItems.map(
      (item) => {
        const extension = item.extension;
        const packageJSON = extension.packageJSON;

        return {
          id: extension.id,
          name: packageJSON.displayName || packageJSON.name,
          version: packageJSON.version,
        };
      },
    );

    await favoritesService.save(favorites);

    quickPick.hide();

    vscode.window.showInformationMessage(
      `⭐ ${favorites.length} extensões salvas como favoritas.`,
    );
  });

  quickPick.onDidHide(() => {
    quickPick.dispose();
  });

  quickPick.show();
}
