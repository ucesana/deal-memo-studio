import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AppSettingsService } from '../services/app-settings.service';

@Injectable({ providedIn: 'root' })
export class PdfRedirectGuard implements CanActivate {
  constructor(
    private router: Router,
    private lastVisited: AppSettingsService,
  ) {}

  canActivate(): boolean {
    const lastId = this.lastVisited.getLastPdfId();
    if (lastId) {
      this.router.navigate(['/dashboard/pdf', lastId]);
    } else {
      this.router.navigate(['/dashboard/missing-document']);
    }
    return false;
  }
}
