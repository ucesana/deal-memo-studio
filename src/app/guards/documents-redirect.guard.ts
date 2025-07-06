import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AppSettingsService } from '../services/app-settings.service';

@Injectable({ providedIn: 'root' })
export class EditorRedirectGuard implements CanActivate {
  constructor(
    private router: Router,
    private lastVisited: AppSettingsService,
  ) {}

  canActivate(): boolean {
    const lastId = this.lastVisited.getLastEditorId();
    if (lastId) {
      this.router.navigate(['/dashboard/docs', lastId]);
    } else {
      this.router.navigate(['/dashboard/missing-document']);
    }
    return false;
  }
}
