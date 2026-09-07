import type * as vscode from "vscode";
import type { Profile } from "../models/Profile";

export class ProfilesService {
  constructor(private readonly state: vscode.Memento) {}

  getAll(): Profile[] {
    return this.state.get<Profile[]>("profiles", []);
  }

  save(profiles: Profile[]): Thenable<void> {
    return this.state.update("profiles", profiles);
  }
}
