import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { SnackService } from '../common/services/snack.service';

declare const google: any;
declare const gapi: any;

const clientId =
  '203219205304-dauqivi3ab03iv3cjg1mjp4rv81telat.apps.googleusercontent.com';
const SCOPES =
  'profile email https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive';

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private readonly _cookieService = inject(CookieService);
  private readonly _snackService = inject(SnackService);
  private readonly _path: string = '/';
  private readonly _accessTokenCookie = 'access_token';
  private readonly _expiresAtCookie = 'expires_at';

  readonly isLoggedInSubject: Subject<boolean> = new BehaviorSubject(false);

  constructor() {}

  login() {
    // @ts-ignore
    google.accounts.oauth2
      .initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          gapi.load('client', () => {
            this.setCookie(
              this._accessTokenCookie,
              tokenResponse.access_token,
              this._path,
            );
            this.setCookie(
              this._expiresAtCookie,
              this.expiresAt(tokenResponse.expires_in),
              this._path,
            );
            gapi.client.setToken({
              access_token: tokenResponse.access_token,
            });
            this.isLoggedInSubject.next(true);
          });
        },
      })
      .requestAccessToken();
  }

  private setCookie(name: string, value: string, path = '/'): void {
    this._cookieService.set(name, value, {
      path: path,
      sameSite: 'Strict',
      secure: false,
    });
  }

  private expiresAt(expiresIn: number): string {
    return `${Date.now() + expiresIn * 1000}`;
  }

  isAuthenticated(): boolean {
    return !!gapi?.client?.getToken();
  }

  logout() {
    if (this.isAuthenticated()) {
      const accessToken = gapi.auth.getToken().access_token;

      fetch(
        `https://accounts.google.com/o/oauth2/revoke?token=${accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-type': 'application/x-www-form-urlencoded',
          },
        },
      ).then((response) => {
        if (response.ok) {
          console.log('Token revoked');
          gapi.client.setToken(null);
        } else {
          console.error('Failed to revoke token');
        }
      });
    }

    this.deleteCookie(this._accessTokenCookie);
    this.deleteCookie(this._expiresAtCookie);
    this.isLoggedInSubject.next(false);
  }

  getIsLoggedIn(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  initAccessToken(): void {
    const accessToken = this._cookieService.get(this._accessTokenCookie);
    if (!accessToken) {
      this.isLoggedInSubject.next(false);
      return;
    }

    const expiresAtStr = this._cookieService.get(this._expiresAtCookie);
    if (!expiresAtStr?.length) {
      this.isLoggedInSubject.next(false);
      return;
    }
    const expiresAt = parseInt(expiresAtStr, 10);
    const hasExpired = Date.now() > expiresAt;

    if (hasExpired) {
      this.isLoggedInSubject.next(false);
      this.openLoginSnack();
    } else {
      gapi.load('client', () => {
        gapi.client.setToken({
          access_token: accessToken,
        });
        this.isLoggedInSubject.next(true);
      });
    }
  }

  public openLoginSnack() {
    this._snackService.openSnackBar('Your session has expired.', 'Login', () =>
      this.login(),
    );
  }

  public hasStoredAccessToken(): boolean {
    const accessToken = this._cookieService.get(this._accessTokenCookie);
    return !!accessToken && accessToken.length > 0;
  }

  public hasStoredExpiresAt(): boolean {
    const expiresAt = this._cookieService.get(this._expiresAtCookie);
    return !!expiresAt && expiresAt.length > 0;
  }

  public isAccessTokenNotExpired(): boolean {
    const expiresAtStr = this._cookieService.get(this._expiresAtCookie);
    if (!expiresAtStr?.length) {
      return true;
    }
    const expiresAt = parseInt(expiresAtStr, 10);
    return Date.now() < expiresAt;
  }

  public isAccessTokenExpired() {
    return !this.isAccessTokenNotExpired();
  }

  public handleError(response: any) {
    if (response.status === 401) {
      this.logout();
    }
    console.error('Error accessing Google API:', response.result.error);
    return throwError(() => response);
  }

  public waitForGapi(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).gapi) return resolve();
      const check = () => {
        if ((window as any).gapi) resolve();
        else setTimeout(check, 50);
      };
      check();
    });
  }

  private deleteCookie(name: string): void {
    this._cookieService.delete(name, '/', undefined, false, 'Strict');
  }
}
