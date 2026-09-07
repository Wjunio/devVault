import * as vscode from "vscode";
import type { Profile } from "../models/Profile";
import type { ProfilesService } from "../services/profilesService";

interface ExtensionQuickPickItem extends vscode.QuickPickItem {
  extension: vscode.Extension<any>;
}

export async function createProfile(profilesService: ProfilesService): Promise<void> {
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

  const profiles = profilesService.getAll();

  profiles.push(profile);

  await profilesService.save(profiles);

  vscode.window.showInformationMessage(
    `📦 Perfil "${profile.name}" criado com ${profile.extensions.length} extensões.`,
  );
}
