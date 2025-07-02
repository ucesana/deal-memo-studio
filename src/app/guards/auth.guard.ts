import { CanActivate, Router } from '@angular/router';
import { inject, Injectable } from '@angular/core';
import { GoogleAuthService } from '../services/google-auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private readonly router: Router = inject(Router);
  private readonly googleAuthService: GoogleAuthService =
    inject(GoogleAuthService);

  constructor() {}

  canActivate(): boolean {
    const authenticated = this.googleAuthService.isAuthenticated();
    if (!authenticated) {
      this.router
        .navigate(['/welcome'])
        .then((_) => this.googleAuthService.openLoginSnack());
    }
    return authenticated;
  }
}
