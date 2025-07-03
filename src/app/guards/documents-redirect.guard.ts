import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LastVisitedService } from '../services/last-visited-service';

@Injectable({ providedIn: 'root' })
export class EditorRedirectGuard implements CanActivate {
  constructor(
    private router: Router,
    private lastVisited: LastVisitedService,
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
