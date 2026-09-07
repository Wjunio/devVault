import * as vscode from "vscode";
import type { FavoriteExtension } from "../models/FavoriteExtension";
import type { Profile } from "../models/Profile";
import type { DevVaultExport } from "../models/DevVaultExport";
import type { ProfilesService } from "../services/profilesService";
import { compareVersions } from "../utils/compareVersions";

export async function importProfile(profilesService: ProfilesService): Promise<void> {
  // ----------------------------------------
  // 1. ESCOLHER ARQUIVO
  // ----------------------------------------

  const files = await vscode.window.showOpenDialog({
    title: "📥 DevVault — Importar perfil",
    canSelectMany: false,
    openLabel: "Importar perfil",
    filters: {
      "DevVault Profile": ["devvault.json"],
      JSON: ["json"],
    },
  });

  if (!files || files.length === 0) {
    return;
  }

  // ----------------------------------------
  // 2. LER ARQUIVO
  // ----------------------------------------

  try {
    const data = await vscode.workspace.fs.readFile(files[0]);

    const content = Buffer.from(data).toString("utf-8");

    const imported: DevVaultExport = JSON.parse(content);

    // ----------------------------------------
    // 3. VALIDAR ARQUIVO
    // ----------------------------------------

    if (
      !imported ||
      imported.version !== 1 ||
      !imported.profile ||
      !imported.profile.name ||
      !Array.isArray(imported.profile.extensions)
    ) {
      vscode.window.showErrorMessage(
        "❌ Este arquivo não é um perfil DevVault válido.",
      );

      return;
    }

    const profile = imported.profile;

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

    for (const extension of profile.extensions) {
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
      `📦 Perfil: ${profile.name}`,
      "",
      `Total de extensões: ${profile.extensions.length}`,
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
      "Importar perfil",
      "Cancelar",
    );

    if (choice !== "Importar perfil") {
      return;
    }

    // ----------------------------------------
    // 6. SALVAR PERFIL
    // ----------------------------------------

    const profiles = profilesService.getAll();

    const existingIndex = profiles.findIndex(
      (item) =>
        item.name.trim().toLowerCase() ===
        profile.name.trim().toLowerCase(),
    );

    if (existingIndex >= 0) {
      const replace = await vscode.window.showWarningMessage(
        `Já existe um perfil chamado "${profile.name}". Deseja substituí-lo?`,
        {
          modal: true,
        },
        "Substituir",
        "Cancelar",
      );

      if (replace !== "Substituir") {
        return;
      }

      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }

    await profilesService.save(profiles);

    // ----------------------------------------
    // 7. INSTALAR / ATUALIZAR EXTENSÕES
    // ----------------------------------------

    const extensionsToInstall = [...missing, ...older];

    if (extensionsToInstall.length === 0) {
      vscode.window.showInformationMessage(
        `📥 Perfil "${profile.name}" importado. Todas as extensões já estão adequadas.`,
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
        `📥 Perfil "${profile.name}" importado. As extensões podem ser instaladas posteriormente.`,
      );

      return;
    }

    // ----------------------------------------
    // 8. INSTALAÇÃO
    // ----------------------------------------

    let success = 0;
    let failed = 0;

    for (const extension of extensionsToInstall) {
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
      }
    }

    // ----------------------------------------
    // 9. RESULTADO
    // ----------------------------------------

    if (failed === 0) {
      vscode.window.showInformationMessage(
        `🎉 Perfil "${profile.name}" importado! ${success} extensões instaladas/atualizadas.`,
      );
    } else {
      vscode.window.showWarningMessage(
        `📥 Perfil importado. ${success} extensões instaladas/atualizadas e ${failed} não puderam ser instaladas.`,
      );
    }
  } catch (error) {
    console.error("Erro ao importar perfil DevVault:", error);

    vscode.window.showErrorMessage(
      "❌ Não foi possível importar o arquivo. Verifique se ele é um arquivo DevVault válido.",
    );
  }
}
