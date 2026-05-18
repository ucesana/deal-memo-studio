import { inject, Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { GoogleAuthService } from '../services/google-auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private readonly router = inject(Router);
  private readonly googleAuthService = inject(GoogleAuthService);

  async canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    if (await this.googleAuthService.ensureAuthenticated()) {
      return true;
    }

    return this.router.createUrlTree(['/dashboard/login'], {
      queryParams: { returnUrl: state.url },
    });
  }
}
