import { CanActivate, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { LastVisitedService } from '../services/last-visited-service';

@Injectable({ providedIn: 'root' })
export class SpreadsheetRedirectGuard implements CanActivate {
  constructor(
    private router: Router,
    private lastVisited: LastVisitedService,
  ) {}

  canActivate(): boolean {
    const lastId = this.lastVisited.getLastSpreadsheetId();
    if (lastId) {
      this.router.navigate(['/spreadsheets', lastId]);
    } else {
      this.router.navigate(['/missing-document']);
    }
    return false;
  }
}
