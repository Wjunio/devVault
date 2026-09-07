import * as vscode from "vscode";
import type { Profile } from "../models/Profile";
import type { DevVaultExport } from "../models/DevVaultExport";
import type { ProfilesService } from "../services/profilesService";

export async function exportProfile(profilesService: ProfilesService): Promise<void> {
  const profiles = profilesService.getAll();

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
}
