import * as vscode from "vscode";
import type { ProfilesService } from "../services/profilesService";

export async function showProfiles(profilesService: ProfilesService): Promise<void> {
  const profiles = profilesService.getAll();

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
}
