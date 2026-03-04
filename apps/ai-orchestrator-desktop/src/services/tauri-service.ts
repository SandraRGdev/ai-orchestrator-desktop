import { invoke } from '@tauri-apps/api/core';

export class TauriService {
  async unlockApp(password: string): Promise<void> {
    return invoke('unlock_app', { password });
  }

  async getAppVersion(): Promise<string> {
    return invoke('get_app_version');
  }
}

export const tauriService = new TauriService();
