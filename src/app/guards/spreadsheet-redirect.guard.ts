import { CanActivate, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { AppSettingsService } from '../services/app-settings.service';

@Injectable({ providedIn: 'root' })
export class SpreadsheetRedirectGuard implements CanActivate {
  constructor(
    private router: Router,
    private lastVisited: AppSettingsService,
  ) {}

  canActivate(): boolean {
    const lastId = this.lastVisited.getLastSpreadsheetId();
    if (lastId) {
      this.router.navigate(['/dashboard/spreadsheets', lastId]);
    } else {
      this.router.navigate(['/dashboard/missing-document']);
    }
    return false;
  }
}
