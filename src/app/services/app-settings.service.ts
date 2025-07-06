import { inject, Injectable } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

export interface Settings {
  lastEditorId?: string;
  lastSpreadsheetId?: string;
  lastPdfId?: string;
  theme?: 'light-theme' | 'dark-theme';
}

@Injectable({
  providedIn: 'root',
})
export class AppSettingsService {
  private readonly _overlayContainer = inject(OverlayContainer);

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

  getTheme(): 'light-theme' | 'dark-theme' {
    return this.getSettings().theme ?? 'light-theme';
  }

  setTheme(theme: 'light-theme' | 'dark-theme'): void {
    const settings = this.getSettings();
    settings.theme = theme;
    this.setSettings(settings);
  }

  public toggleTheme() {
    document.body.classList.remove('light-theme', 'dark-theme');
    this._overlayContainer
      .getContainerElement()
      .classList.remove('light-theme', 'dark-theme');
    const theme = this.getTheme();
    const newTheme = theme === 'dark-theme' ? 'light-theme' : 'dark-theme';
    this.applyTheme(newTheme);
  }

  public initTheme() {
    this.applyTheme(this.getTheme());
  }

  private applyTheme(newTheme: 'light-theme' | 'dark-theme') {
    document.body.classList.add(newTheme);
    this._overlayContainer.getContainerElement().classList.add(newTheme);
    this.setTheme(newTheme);
  }
}
