import * as vscode from "vscode";

export function listExtensions(): void {
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
}
