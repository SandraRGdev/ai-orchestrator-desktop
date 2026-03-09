import { invoke } from '@tauri-apps/api/core';

// Check if running in Tauri context
const isTauri = () => {
  return typeof window !== 'undefined' && window.__TAURI__;
};

export class TauriService {
  async unlockApp(password: string): Promise<void> {
    if (!isTauri()) {
      console.log('[TauriService] Web mode: skipping unlock');
      return;
    }
    return invoke('unlock_app', { password });
  }

  async getAppVersion(): Promise<string> {
    if (!isTauri()) {
      console.log('[TauriService] Web mode: returning default version');
      return '0.1.0-dev';
    }
    return invoke('get_app_version');
  }
}

export const tauriService = new TauriService();
