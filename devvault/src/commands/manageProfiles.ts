import * as vscode from "vscode";
import type { ProfilesService } from "../services/profilesService";

interface ExtensionQuickPickItem extends vscode.QuickPickItem {
  extension: vscode.Extension<any>;
}

export async function manageProfiles(profilesService: ProfilesService): Promise<void> {
  try {
    await runManageProfiles(profilesService);
  } catch (error) {
    console.error("[DevVault] Falha ao gerenciar perfis:", error);
    const message = error instanceof Error ? error.message : String(error);
    await vscode.window.showErrorMessage(
      `DevVault: não foi possível gerenciar perfis. ${message}`,
    );
  }
}

async function runManageProfiles(profilesService: ProfilesService): Promise<void> {
  // Keep edits local until the user finishes all steps and saves.
  const profiles = profilesService.getAll().map((profile) => ({ ...profile }));

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

    await profilesService.save(profiles);

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

    await profilesService.save(profiles);

    vscode.window.showInformationMessage(
      `🗑️ Perfil "${selected.profile.name}" excluído.`,
    );
  }
}
