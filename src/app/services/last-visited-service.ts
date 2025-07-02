import { Injectable } from '@angular/core';

export interface Settings {
  lastEditorId?: string;
  lastSpreadsheetId?: string;
  lastPdfId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LastVisitedService {
  private readonly KEY = 'settings';

  setSettings(settings: Settings): void {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }

  getSettings(): Settings {
    try {
      const settings = localStorage.getItem(this.KEY);
      return settings ? JSON.parse(settings) : {};
    } catch (e) {
      console.error(e);
      return {};
    }
  }

  getLastEditorId(): string | undefined {
    return this.getSettings().lastEditorId;
  }

  setLastEditorId(id: string): void {
    const settings = this.getSettings();
    settings.lastEditorId = id;
    this.setSettings(settings);
  }

  getLastSpreadsheetId() {
    return this.getSettings().lastSpreadsheetId;
  }

  setLastSpreadsheetId(id: string): void {
    const settings = this.getSettings();
    settings.lastSpreadsheetId = id;
    this.setSettings(settings);
  }

  getLastPdfId() {
    return this.getSettings().lastPdfId;
  }

  setLastPdfId(id: string): void {
    const settings = this.getSettings();
    settings.lastPdfId = id;
    this.setSettings(settings);
  }
}
