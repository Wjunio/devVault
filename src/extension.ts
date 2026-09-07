import * as vscode from "vscode";
import { listExtensions } from "./commands/listExtensions";
import { manageFavorites } from "./commands/manageFavorites";
import { showFavorites } from "./commands/showFavorites";
import { createProfile } from "./commands/createProfile";
import { showProfiles } from "./commands/showProfiles";
import { manageProfiles } from "./commands/manageProfiles";
import { exportProfile } from "./commands/exportProfile";
import { importProfile } from "./commands/importProfile";
import { FavoritesService } from "./services/favoritesService";
import { ProfilesService } from "./services/profilesService";

export function activate(context: vscode.ExtensionContext) {
  console.log("DevVault foi ativado!");

  const favoritesService = new FavoritesService(context.globalState);
  const profilesService = new ProfilesService(context.globalState);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "devvault.listExtensions",
      () => listExtensions(),
    ),
    vscode.commands.registerCommand(
      "devvault.manageFavorites",
      () => manageFavorites(favoritesService),
    ),
    vscode.commands.registerCommand(
      "devvault.showFavorites",
      () => showFavorites(favoritesService),
    ),
    vscode.commands.registerCommand(
      "devvault.createProfile",
      () => createProfile(profilesService),
    ),
    vscode.commands.registerCommand(
      "devvault.showProfiles",
      () => showProfiles(profilesService),
    ),
    vscode.commands.registerCommand(
      "devvault.manageProfiles",
      () => manageProfiles(profilesService),
    ),
    vscode.commands.registerCommand(
      "devvault.exportProfile",
      () => exportProfile(profilesService),
    ),
    vscode.commands.registerCommand(
      "devvault.importProfile",
      () => importProfile(profilesService),
    ),
  );
}

export function deactivate() {}
