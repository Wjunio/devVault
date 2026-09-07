import * as vscode from "vscode";

interface FavoriteExtension {
  id: string;
  name: string;
  version: string;
}

interface Profile {
  name: string;
  description: string;
  extensions: FavoriteExtension[];
}

interface ExtensionQuickPickItem extends vscode.QuickPickItem {
  extension: vscode.Extension<any>;
}

interface DevVaultExport {
  version: number;
  profile: Profile;
}

export function activate(context: vscode.ExtensionContext) {
  console.log("DevVault foi ativado!");

  // ==========================================
  // COMANDO: LISTAR EXTENSÕES
  // ==========================================

  const listExtensions = vscode.commands.registerCommand(
    "devvault.listExtensions",
    () => {
      const extensions = vscode.extensions.all.filter(
        (extension) => !extension.id.startsWith("vscode."),
      );

      const output = vscode.window.createOutputChannel("DevVault");

      output.clear();

      output.appendLine("========================================");
      output.appendLine("              DEVVAULT");
      output.appendLine("          Extensões instaladas");
      output.appendLine("========================================");
      output.appendLine("");

      output.appendLine(`Total de extensões: ${extensions.length}`);
      output.appendLine("");

      extensions.forEach((extension, index) => {
        const packageJSON = extension.packageJSON;

        output.appendLine(
          `${index + 1}. ${packageJSON.displayName || packageJSON.name}`,
        );

        output.appendLine(`   ID: ${extension.id}`);
        output.appendLine(`   Versão: ${packageJSON.version}`);
        output.appendLine("");
      });

      output.show();
    },
  );

  // ==========================================
  // COMANDO: GERENCIAR FAVORITOS
  // ==========================================

  const manageFavorites = vscode.commands.registerCommand(
    "devvault.manageFavorites",
    async () => {
      const extensions = vscode.extensions.all.filter(
        (extension) => !extension.id.startsWith("vscode."),
      );

      const savedFavorites = context.globalState.get<FavoriteExtension[]>(
        "favorites",
        [],
      );

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

        await context.globalState.update("favorites", favorites);

        quickPick.hide();

        vscode.window.showInformationMessage(
          `⭐ ${favorites.length} extensões salvas como favoritas.`,
        );
      });

      quickPick.onDidHide(() => {
        quickPick.dispose();
      });

      quickPick.show();
    },
  );

  // ==========================================
  // COMANDO: MOSTRAR FAVORITOS
  // ==========================================

  const showFavorites = vscode.commands.registerCommand(
    "devvault.showFavorites",
    () => {
      const favorites = context.globalState.get<FavoriteExtension[]>(
        "favorites",
        [],
      );

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
    },
  );

  // ==========================================
  // COMANDO: CRIAR PERFIL
  // ==========================================

  const createProfile = vscode.commands.registerCommand(
    "devvault.createProfile",
    async () => {
      const name = await vscode.window.showInputBox({
        title: "📦 DevVault — Criar perfil",
        prompt: "Digite o nome do perfil",
        placeHolder: "Ex.: Angular Developer",
        validateInput: (value) => {
          if (!value.trim()) {
            return "Digite um nome para o perfil.";
          }

          return undefined;
        },
      });

      if (!name) {
        return;
      }

      const description = await vscode.window.showInputBox({
        title: "📦 DevVault — Criar perfil",
        prompt: "Digite uma descrição para o perfil",
        placeHolder: "Ex.: Meu ambiente para desenvolvimento Angular",
      });

      if (description === undefined) {
        return;
      }

      const extensions = vscode.extensions.all.filter(
        (extension) => !extension.id.startsWith("vscode."),
      );

      if (extensions.length === 0) {
        vscode.window.showWarningMessage(
          "Nenhuma extensão instalada foi encontrada.",
        );

        return;
      }

      const items: ExtensionQuickPickItem[] = extensions.map((extension) => {
        const packageJSON = extension.packageJSON;

        return {
          label: packageJSON.displayName || packageJSON.name,
          description: `Versão ${packageJSON.version}`,
          detail: extension.id,
          extension,
        };
      });

      const selected = await vscode.window.showQuickPick(items, {
        title: `📦 ${name}`,
        placeHolder: "Selecione as extensões que farão parte deste perfil",
        canPickMany: true,
      });

      if (!selected) {
        return;
      }

      const profile: Profile = {
        name: name.trim(),
        description: description.trim(),

        extensions: selected.map((item) => {
          const extension = item.extension;
          const packageJSON = extension.packageJSON;

          return {
            id: extension.id,
            name: packageJSON.displayName || packageJSON.name,
            version: packageJSON.version,
          };
        }),
      };

      const profiles = context.globalState.get<Profile[]>("profiles", []);

      profiles.push(profile);

      await context.globalState.update("profiles", profiles);

      vscode.window.showInformationMessage(
        `📦 Perfil "${profile.name}" criado com ${profile.extensions.length} extensões.`,
      );
    },
  );

  // ==========================================
  // COMANDO: MOSTRAR PERFIS
  // ==========================================

  const showProfiles = vscode.commands.registerCommand(
    "devvault.showProfiles",
    async () => {
      const profiles = context.globalState.get<Profile[]>("profiles", []);

      if (profiles.length === 0) {
        vscode.window.showInformationMessage(
          "Você ainda não possui nenhum perfil criado.",
        );

        return;
      }

      const items = profiles.map((profile) => ({
        label: `$(package) ${profile.name}`,
        description: `${profile.extensions.length} extensões`,
        detail: profile.description || "Sem descrição",
        profile,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        title: "📦 DevVault — Meus perfis",
        placeHolder: "Selecione um perfil para visualizar",
      });

      if (!selected) {
        return;
      }

      const output = vscode.window.createOutputChannel("DevVault");

      output.clear();

      output.appendLine("========================================");
      output.appendLine(`          📦 ${selected.profile.name}`);
      output.appendLine("========================================");
      output.appendLine("");

      output.appendLine(
        `Descrição: ${selected.profile.description || "Sem descrição"}`,
      );

      output.appendLine("");

      output.appendLine(
        `Total de extensões: ${selected.profile.extensions.length}`,
      );

      output.appendLine("");

      output.appendLine("----------------------------------------");
      output.appendLine("");

      selected.profile.extensions.forEach((extension, index) => {
        output.appendLine(`${index + 1}. ${extension.name}`);
        output.appendLine(`   ID: ${extension.id}`);
        output.appendLine(`   Versão: ${extension.version}`);
        output.appendLine("");
      });

      output.show();
    },
  );

  // ==========================================
  // COMANDO: GERENCIAR PERFIS
  // ==========================================

  const manageProfiles = vscode.commands.registerCommand(
    "devvault.manageProfiles",
    async () => {
      const profiles = context.globalState.get<Profile[]>("profiles", []);

      if (profiles.length === 0) {
        vscode.window.showInformationMessage(
          "Você ainda não possui nenhum perfil criado.",
        );

        return;
      }

      const items = profiles.map((profile, index) => ({
        label: `$(package) ${profile.name}`,
        description: `${profile.extensions.length} extensões`,
        detail: profile.description || "Sem descrição",
        profile,
        index,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        title: "📦 DevVault — Gerenciar perfis",
        placeHolder: "Selecione um perfil",
      });

      if (!selected) {
        return;
      }

      const action = await vscode.window.showQuickPick(
        [
          {
            label: "$(edit) Editar perfil",
            value: "edit",
          },
          {
            label: "$(trash) Excluir perfil",
            value: "delete",
          },
        ],
        {
          title: `📦 ${selected.profile.name}`,
          placeHolder: "Escolha uma ação",
        },
      );

      if (!action) {
        return;
      }

      // ==========================================
      // EDITAR PERFIL
      // ==========================================

      if (action.value === "edit") {
        const newName = await vscode.window.showInputBox({
          title: "✏️ Editar perfil",
          prompt: "Nome do perfil",
          value: selected.profile.name,
          validateInput: (value) => {
            if (!value.trim()) {
              return "Digite um nome para o perfil.";
            }

            return undefined;
          },
        });

        if (!newName) {
          return;
        }

        const newDescription = await vscode.window.showInputBox({
          title: "✏️ Editar perfil",
          prompt: "Descrição do perfil",
          value: selected.profile.description,
        });

        if (newDescription === undefined) {
          return;
        }

        profiles[selected.index].name = newName.trim();
        profiles[selected.index].description = newDescription.trim();

        const changeExtensions = await vscode.window.showQuickPick(
          [
            {
              label: "$(check) Manter extensões atuais",
              value: "keep",
            },
            {
              label: "$(extensions) Alterar extensões",
              value: "change",
            },
          ],
          {
            title: "Extensões do perfil",
            placeHolder: "Deseja alterar as extensões?",
          },
        );

        if (!changeExtensions) {
          return;
        }

        if (changeExtensions.value === "change") {
          const extensions = vscode.extensions.all.filter(
            (extension) => !extension.id.startsWith("vscode."),
          );

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

          const selectedExtensions = await vscode.window.showQuickPick(
            extensionItems,
            {
              title: `✏️ ${newName}`,
              placeHolder: "Selecione as extensões do perfil",
              canPickMany: true,
            },
          );

          if (selectedExtensions === undefined) {
            return;
          }

          profiles[selected.index].extensions = selectedExtensions.map(
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
        }

        await context.globalState.update("profiles", profiles);

        vscode.window.showInformationMessage(
          `✏️ Perfil "${profiles[selected.index].name}" atualizado.`,
        );

        return;
      }

      // ==========================================
      // EXCLUIR PERFIL
      // ==========================================

      if (action.value === "delete") {
        const confirmation = await vscode.window.showWarningMessage(
          `Tem certeza que deseja excluir o perfil "${selected.profile.name}"?`,
          {
            modal: true,
          },
          "Excluir",
        );

        if (confirmation !== "Excluir") {
          return;
        }

        profiles.splice(selected.index, 1);

        await context.globalState.update("profiles", profiles);

        vscode.window.showInformationMessage(
          `🗑️ Perfil "${selected.profile.name}" excluído.`,
        );
      }
    },
  );

  // ==========================================
  // COMANDO: EXPORTAR PERFIL
  // ==========================================

  const exportProfile = vscode.commands.registerCommand(
    "devvault.exportProfile",
    async () => {
      const profiles = context.globalState.get<Profile[]>("profiles", []);

      if (profiles.length === 0) {
        vscode.window.showInformationMessage(
          "Você ainda não possui nenhum perfil para exportar.",
        );

        return;
      }

      const selected = await vscode.window.showQuickPick(
        profiles.map((profile) => ({
          label: `📦 ${profile.name}`,
          description: `${profile.extensions.length} extensões`,
          detail: profile.description,
          profile,
        })),
        {
          title: "📤 DevVault — Exportar perfil",
          placeHolder: "Selecione o perfil que deseja exportar",
        },
      );

      if (!selected) {
        return;
      }

      const safeName = selected.profile.name
        .trim()
        .replace(/[<>:"/\\|?*]/g, "-");

      const uri = await vscode.window.showSaveDialog({
        title: "Salvar perfil do DevVault",
        defaultUri: vscode.Uri.file(`${safeName}.devvault.json`),
        filters: {
          "DevVault Profile": ["devvault.json"],
          JSON: ["json"],
        },
      });

      if (!uri) {
        return;
      }

      const exportData: DevVaultExport = {
        version: 1,
        profile: selected.profile,
      };

      const content = JSON.stringify(exportData, null, 2);

      await vscode.workspace.fs.writeFile(uri, Buffer.from(content, "utf-8"));

      vscode.window.showInformationMessage(
        `📤 Perfil "${selected.profile.name}" exportado com sucesso.`,
      );
    },
  );

  // ==========================================
  // COMANDO: IMPORTAR PERFIL
  // ==========================================

  const importProfile = vscode.commands.registerCommand(
    "devvault.importProfile",
    async () => {
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

        const profiles = context.globalState.get<Profile[]>("profiles", []);

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

        await context.globalState.update("profiles", profiles);

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
    },
  );

  // ==========================================
  // REGISTRA OS COMANDOS
  // ==========================================

  context.subscriptions.push(
    listExtensions,
    manageFavorites,
    showFavorites,
    createProfile,
    showProfiles,
    manageProfiles,
    exportProfile,
    importProfile,
  );
}

// ==========================================
// COMPARADOR SIMPLES DE VERSÕES
// ==========================================

function compareVersions(versionA: string, versionB: string): number {
  const cleanA = versionA
    .replace(/^[^\d]*/, "")
    .split(".")
    .map((part) => parseInt(part, 10) || 0);

  const cleanB = versionB
    .replace(/^[^\d]*/, "")
    .split(".")
    .map((part) => parseInt(part, 10) || 0);

  const length = Math.max(cleanA.length, cleanB.length);

  for (let i = 0; i < length; i++) {
    const a = cleanA[i] || 0;
    const b = cleanB[i] || 0;

    if (a > b) {
      return 1;
    }

    if (a < b) {
      return -1;
    }
  }

  return 0;
}

export function deactivate() {}
