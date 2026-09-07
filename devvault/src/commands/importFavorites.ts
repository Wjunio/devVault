import * as vscode from "vscode";
import type { FavoriteExtension } from "../models/FavoriteExtension";
import type { FavoritesService } from "../services/favoritesService";
import { isDevVaultFavoritesExport } from "../utils/isDevVaultFavoritesExport";
import { compareVersions } from "../utils/compareVersions";

export async function importFavorites(favoritesService: FavoritesService): Promise<void> {
  try {
    const files = await vscode.window.showOpenDialog({
      title: "📥 DevVault — Importar favoritos",
      canSelectMany: false,
      openLabel: "Importar favoritos",
      filters: { JSON: ["json"] },
    });

    if (!files || files.length === 0) {
      return;
    }

    const data = await vscode.workspace.fs.readFile(files[0]);

    const content = Buffer.from(data).toString("utf-8");

    const imported: unknown = JSON.parse(content.replace(/^\uFEFF/, ""));

    // ----------------------------------------
    // 3. VALIDAR ARQUIVO
    // ----------------------------------------

    if (!isDevVaultFavoritesExport(imported)) {
      vscode.window.showErrorMessage(
        "❌ Este arquivo não é um arquivo de favoritos DevVault válido.",
      );

      return;
    }

    // Consolidate repeated IDs before planning installations to avoid downgrades.
    const importedMap = new Map<string, FavoriteExtension>();
    for (const favorite of imported.extensions) {
      const key = favorite.id.toLowerCase();
      const existing = importedMap.get(key);
      if (!existing || compareVersions(favorite.version, existing.version) > 0) {
        importedMap.set(key, favorite);
      }
    }
    const extensions = Array.from(importedMap.values());

    // ----------------------------------------
    // 4. VERIFICAR EXTENSÕES
    // ----------------------------------------

    const installedExtensions = new Map(
      vscode.extensions.all
        .filter((extension) => !extension.id.startsWith("vscode."))
        .map((extension) => [extension.id.toLowerCase(), extension]),
    );

    const missing: FavoriteExtension[] = [];
    const older: FavoriteExtension[] = [];
    const newer: FavoriteExtension[] = [];
    const sameVersion: FavoriteExtension[] = [];

    for (const extension of extensions) {
      const installed = installedExtensions.get(extension.id.toLowerCase());

      if (!installed) {
        missing.push(extension);
        continue;
      }

      const installedVersion = installed.packageJSON.version;

      const comparison = compareVersions(
        installedVersion,
        extension.version,
      );

      if (comparison > 0) {
        newer.push(extension);
      } else if (comparison < 0) {
        older.push(extension);
      } else {
        sameVersion.push(extension);
      }
    }

    // ----------------------------------------
    // 5. MOSTRAR RESUMO
    // ----------------------------------------

    const summary = [
      "⭐ DevVault — Importar favoritos",
      "",
      `Total de extensões: ${extensions.length}`,
      `✅ Já na mesma versão: ${sameVersion.length}`,
      `🆕 Versão instalada maior: ${newer.length}`,
      `⬆️ Versão instalada menor: ${older.length}`,
      `⬇️ Não instaladas: ${missing.length}`,
      "",
      "A versão maior já instalada nunca será substituída.",
    ].join("\n");

    const choice = await vscode.window.showInformationMessage(
      summary,
      {
        modal: true,
      },
      "Importar favoritos",
      "Cancelar",
    );

    if (choice !== "Importar favoritos") {
      return;
    }

    // ----------------------------------------
    // 6. SALVAR FAVORITOS
    // ----------------------------------------

    const favoritesMap = new Map<string, FavoriteExtension>();
    for (const favorite of [...favoritesService.getAll(), ...extensions]) {
      const key = favorite.id.toLowerCase();
      const existing = favoritesMap.get(key);
      if (!existing || compareVersions(favorite.version, existing.version) > 0) {
        favoritesMap.set(key, favorite);
      }
    }
    await favoritesService.save(Array.from(favoritesMap.values()));

    // ----------------------------------------
    // 7. INSTALAR / ATUALIZAR EXTENSÕES
    // ----------------------------------------

    const extensionsToInstall = [...missing, ...older];

    if (extensionsToInstall.length === 0) {
      vscode.window.showInformationMessage(
        `📥 Favoritos importados. Todas as extensões já estão adequadas.`,
      );

      return;
    }

    const install = await vscode.window.showInformationMessage(
      `📦 ${extensionsToInstall.length} extensões precisam ser instaladas ou atualizadas.`,
      "Instalar agora",
      "Fazer depois",
    );

    if (install !== "Instalar agora") {
      vscode.window.showInformationMessage(
        `📥 Favoritos importados. As extensões podem ser instaladas posteriormente.`,
      );

      return;
    }

    // ----------------------------------------
    // 8. INSTALAÇÃO
    // ----------------------------------------

    let success = 0;
    let failed = 0;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "DevVault: Importar favoritos",
        cancellable: false,
      },
      async (progress) => {
        for (const extension of extensionsToInstall) {
          progress.report({
            message: `${success + failed + 1}/${extensionsToInstall.length}: ${extension.name}`,
          });

          try {
            await vscode.commands.executeCommand(
              "workbench.extensions.installExtension",
              `${extension.id}@${extension.version}`,
            );

            success++;
          } catch (error) {
            console.error(
              `Erro ao instalar ${extension.id}@${extension.version}`,
              error,
            );

            failed++;
          } finally {
            progress.report({ increment: 100 / extensionsToInstall.length });
          }
        }
      },
    );

    // ----------------------------------------
    // 9. RESULTADO
    // ----------------------------------------

    if (failed === 0) {
      vscode.window.showInformationMessage(
        `🎉 Favoritos importados! ${success} extensões instaladas/atualizadas.`,
      );
    } else {
      vscode.window.showWarningMessage(
        `📥 Favoritos importados. ${success} extensões instaladas/atualizadas e ${failed} não puderam ser instaladas.`,
      );
    }
  } catch (error) {
    console.error("Erro ao importar favoritos DevVault:", error);

    vscode.window.showErrorMessage(
      "❌ Não foi possível importar o arquivo. Verifique se ele é um arquivo DevVault válido.",
    );
  }
}
