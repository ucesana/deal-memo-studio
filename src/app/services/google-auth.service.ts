import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  defer,
  firstValueFrom,
  from,
  Observable,
  Subject,
  throwError,
} from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { SnackService } from '../common/services/snack.service';
import { GapiLoaderService } from './gapi-loader.service';

declare const google: any;
declare const gapi: any;

const clientId =
  '203219205304-dauqivi3ab03iv3cjg1mjp4rv81telat.apps.googleusercontent.com';
/**
 * Optional. Set this to a Desktop OAuth client secret from Google Cloud Console
 * to enable authorization-code login with a stored refresh token.
 * Web OAuth clients cannot exchange codes from the browser without a secret.
 */
const clientSecret = '';
const SCOPES =
  'profile email https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';
const OAUTH_AUTHORIZE_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const PKCE_VERIFIER_KEY = 'deal_memo_pkce_verifier';
const OAUTH_STATE_KEY = 'deal_memo_oauth_state';
const OAUTH_CALLBACK_MESSAGE_TYPE = 'deal-memo-oauth-callback';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
}

interface TokenClientPendingRequest {
  resolve: () => void;
  reject: (error: Error) => void;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private readonly _cookieService = inject(CookieService);
  private readonly _snackService = inject(SnackService);
  private readonly _gapiLoader = inject(GapiLoaderService);
  private readonly _path: string = '/';
  private readonly _accessTokenCookie = 'access_token';
  private readonly _expiresAtCookie = 'expires_at';
  private readonly _refreshTokenStorageKey = 'deal_memo_refresh_token';

  readonly isLoggedInSubject: Subject<boolean> = new BehaviorSubject(false);

  private tokenClient: any = null;
  private tokenClientPendingRequest: TokenClientPendingRequest | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    if (this.supportsAuthorizationCodeLogin()) {
      this.handleOAuthCallbackInPopup();
      window.addEventListener('message', this.onOAuthMessage);
    }
  }

  login(): void {
    if (this.supportsAuthorizationCodeLogin()) {
      void this.startPkceAuthorization('consent');
      return;
    }

    void this.requestAccessTokenFromGoogle('consent').catch(() =>
      this.openLoginSnack(),
    );
  }

  /** Restores cookie session into gapi when needed; resolves when auth is ready or absent. */
  ensureAuthenticated(): Promise<boolean> {
    if (this.isAuthenticated() && this.isAccessTokenNotExpired()) {
      return Promise.resolve(true);
    }

    if (this.hasStoredAccessToken() && this.isAccessTokenNotExpired()) {
      return this._gapiLoader.whenClientLoaded().then(() => {
        if (!this.isAuthenticated()) {
          gapi.client.setToken({
            access_token: this.getStoredAccessToken(),
          });
        }
        this.isLoggedInSubject.next(true);
        return true;
      });
    }

    if (
      this.hasStoredRefreshToken() ||
      (this.hasStoredAccessToken() && this.isAccessTokenExpired())
    ) {
      return this.refreshAccessToken()
        .then(() => this.isAuthenticated())
        .catch(() => false);
    }

    return Promise.resolve(false);
  }

  initializeSession(): void {
    if (this.hasStoredAccessToken() && this.isAccessTokenNotExpired()) {
      this.initAccessToken();
      return;
    }

    if (
      this.hasStoredRefreshToken() ||
      this.hasStoredAccessToken() ||
      this.isAccessTokenExpired()
    ) {
      this.refreshAccessToken().catch(() => {
        this.isLoggedInSubject.next(false);
      });
    }
  }

  logout(): void {
    const accessToken = this.getStoredAccessToken();
    const refreshToken = this.getStoredRefreshToken();
    const tokenToRevoke = refreshToken ?? accessToken;

    if (tokenToRevoke) {
      fetch(`${REVOKE_ENDPOINT}?token=${encodeURIComponent(tokenToRevoke)}`, {
        method: 'POST',
        headers: {
          'Content-type': 'application/x-www-form-urlencoded',
        },
      }).then((response) => {
        if (response.ok) {
          console.log('Token revoked');
        } else {
          console.error('Failed to revoke token');
        }
      });
    }

    if (this.isAuthenticated()) {
      gapi.client.setToken(null);
    }

    this.clearStoredTokens();
    this.isLoggedInSubject.next(false);
  }

  getIsLoggedIn(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  initAccessToken(): void {
    const accessToken = this.getStoredAccessToken();
    if (!accessToken) {
      this.isLoggedInSubject.next(false);
      return;
    }

    const expiresAtStr = this._cookieService.get(this._expiresAtCookie);
    if (!expiresAtStr?.length) {
      this.isLoggedInSubject.next(false);
      return;
    }

    if (this.isAccessTokenExpired()) {
      this.refreshAccessToken().catch(() => this.openLoginSnack());
      return;
    }

    this._gapiLoader.whenClientLoaded().then(() => {
      gapi.client.setToken({
        access_token: accessToken,
      });
      this.isLoggedInSubject.next(true);
    });
  }

  public openLoginSnack() {
    this._snackService.openSnackBar('Your session has expired.', 'Login', () =>
      this.login(),
    );
  }

  public hasStoredAccessToken(): boolean {
    return !!this.getStoredAccessToken();
  }

  public hasStoredExpiresAt(): boolean {
    const expiresAt = this._cookieService.get(this._expiresAtCookie);
    return !!expiresAt && expiresAt.length > 0;
  }

  public hasStoredRefreshToken(): boolean {
    return !!this.getStoredRefreshToken();
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

  isAuthenticated(): boolean {
    return !!gapi?.client?.getToken();
  }

  /** Waits for any in-flight refresh, then returns a valid access token. */
  getAccessToken(): Promise<string> {
    return this.waitForValidAccessToken().then(() => {
      const token = gapi?.client?.getToken()?.access_token;
      if (token) {
        return token;
      }

      const storedToken = this.getStoredAccessToken();
      if (storedToken) {
        return storedToken;
      }

      throw new Error('No access token available.');
    });
  }

  /** Queues requests while refreshing and retries once after a 401/403. */
  fromAuthorized<T>(request: () => Observable<T>): Observable<T> {
    return defer(() => from(this.waitForValidAccessToken())).pipe(
      switchMap(() => request()),
      catchError((error) => {
        if (!this.isAuthError(error)) {
          return throwError(() => error);
        }

        return from(this.refreshAccessToken()).pipe(
          switchMap(() => request()),
          catchError((refreshError) => {
            this.clearStoredTokens();
            this.isLoggedInSubject.next(false);
            this.openLoginSnack();
            return throwError(() => refreshError);
          }),
        );
      }),
    );
  }

  /** Promise-based variant of {@link fromAuthorized}. */
  runAuthorized<T>(request: () => Promise<T>): Promise<T> {
    return firstValueFrom(this.fromAuthorized(() => from(request())));
  }

  /** Performs an authorized fetch, queueing while a refresh is in progress. */
  authorizedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    return this.runAuthorized(async () => {
      const accessToken = await this.getAccessToken();
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${accessToken}`);

      const response = await fetch(input, { ...init, headers });
      if (this.isAuthHttpStatus(response.status)) {
        throw { status: response.status, result: { error: response.statusText } };
      }
      return response;
    });
  }

  refreshAccessToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.doRefreshAccessToken().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  public handleError(response: any) {
    if (this.isAuthError(response)) {
      return from(this.refreshAccessToken()).pipe(
        switchMap(() =>
          throwError(() => ({
            ...response,
            authRefreshAttempted: true,
          })),
        ),
        catchError(() => {
          this.clearStoredTokens();
          this.isLoggedInSubject.next(false);
          this.openLoginSnack();
          return throwError(() => response);
        }),
      );
    }

    console.error('Error accessing Google API:', response.result?.error);
    return throwError(() => response);
  }

  private supportsAuthorizationCodeLogin(): boolean {
    return clientSecret.length > 0;
  }

  private ensureTokenClient(): void {
    if (this.tokenClient) {
      return;
    }

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response: { access_token?: string; expires_in?: number; error?: string }) => {
        void this.handleTokenClientResponse(response);
      },
    });
  }

  private async handleTokenClientResponse(response: {
    access_token?: string;
    expires_in?: number;
    error?: string;
  }): Promise<void> {
    const pending = this.tokenClientPendingRequest;
    this.tokenClientPendingRequest = null;

    if (response.error || !response.access_token || !response.expires_in) {
      pending?.reject(
        new Error(response.error ?? 'Google token client did not return an access token.'),
      );
      return;
    }

    try {
      await this.applyTokenResponse({
        access_token: response.access_token,
        expires_in: response.expires_in,
      });
      pending?.resolve();
    } catch (error) {
      pending?.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private requestAccessTokenFromGoogle(prompt: '' | 'consent'): Promise<void> {
    this.ensureTokenClient();

    return new Promise((resolve, reject) => {
      this.tokenClientPendingRequest = { resolve, reject };
      this.tokenClient.requestAccessToken({ prompt });
    });
  }

  private async doRefreshAccessToken(): Promise<void> {
    const refreshToken = this.getStoredRefreshToken();
    if (refreshToken) {
      try {
        await this.performRefreshTokenGrant(refreshToken);
        return;
      } catch (error) {
        console.warn('Stored refresh token is no longer valid.', error);
        localStorage.removeItem(this._refreshTokenStorageKey);
      }
    }

    await this.requestAccessTokenFromGoogle('');
  }

  private async startPkceAuthorization(prompt: '' | 'consent'): Promise<void> {
    const codeVerifier = this.generateCodeVerifier();
    sessionStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier);
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateRandomString(32);
    sessionStorage.setItem(OAUTH_STATE_KEY, state);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.getRedirectUri(),
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `${OAUTH_AUTHORIZE_ENDPOINT}?${params.toString()}`,
      'deal-memo-google-oauth',
      `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      this._snackService.openSnackBar(
        'Allow popups in your browser to sign in with Google.',
        'OK',
      );
    }
  }

  private handleOAuthCallbackInPopup(): void {
    if (!window.opener || window.opener === window) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (!code && !error) {
      return;
    }

    window.opener.postMessage(
      {
        type: OAUTH_CALLBACK_MESSAGE_TYPE,
        code,
        state,
        error,
      },
      window.location.origin,
    );
    window.close();
  }

  private readonly onOAuthMessage = (event: MessageEvent): void => {
    if (event.origin !== window.location.origin) {
      return;
    }

    const data = event.data;
    if (data?.type !== OAUTH_CALLBACK_MESSAGE_TYPE) {
      return;
    }

    if (data.error || !data.code) {
      console.error('Google OAuth failed:', data.error);
      this.openLoginSnack();
      return;
    }

    const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY);
    if (!expectedState || data.state !== expectedState) {
      console.error('OAuth state mismatch.');
      this.openLoginSnack();
      return;
    }

    this.exchangeAuthorizationCode(data.code).catch((error) => {
      console.error('Failed to exchange authorization code:', error);
      this.openLoginSnack();
    });
  };

  private async exchangeAuthorizationCode(code: string): Promise<void> {
    const codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
    if (!codeVerifier) {
      throw new Error('PKCE verifier not found.');
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.getRedirectUri(),
      code_verifier: codeVerifier,
    });

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const tokenResponse = (await response.json()) as GoogleTokenResponse;
    await this.applyTokenResponse(tokenResponse);
  }

  private async performRefreshTokenGrant(refreshToken: string): Promise<void> {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    if (clientSecret.length > 0) {
      body.set('client_secret', clientSecret);
    }

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const tokenResponse = (await response.json()) as GoogleTokenResponse;
    await this.applyTokenResponse(tokenResponse, refreshToken);
  }

  private async applyTokenResponse(
    tokenResponse: GoogleTokenResponse,
    existingRefreshToken?: string,
  ): Promise<void> {
    await this._gapiLoader.whenClientLoaded();

    const refreshToken =
      tokenResponse.refresh_token ?? existingRefreshToken ?? null;
    if (refreshToken) {
      localStorage.setItem(this._refreshTokenStorageKey, refreshToken);
    }

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
  }

  private waitForValidAccessToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (this.isAuthenticated() && this.isAccessTokenNotExpired()) {
      return Promise.resolve();
    }

    if (this.hasStoredAccessToken() && this.isAccessTokenNotExpired()) {
      return this._gapiLoader.whenClientLoaded().then(() => {
        if (!this.isAuthenticated()) {
          gapi.client.setToken({
            access_token: this.getStoredAccessToken(),
          });
        }
      });
    }

    if (
      this.hasStoredRefreshToken() ||
      this.hasStoredAccessToken() ||
      this.isAccessTokenExpired()
    ) {
      return this.refreshAccessToken();
    }

    return Promise.resolve();
  }

  private getRedirectUri(): string {
    return window.location.origin;
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(digest));
  }

  private generateRandomString(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array).slice(0, length);
  }

  private base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private clearStoredTokens(): void {
    this.deleteCookie(this._accessTokenCookie);
    this.deleteCookie(this._expiresAtCookie);
    localStorage.removeItem(this._refreshTokenStorageKey);
    if (typeof gapi !== 'undefined') {
      gapi.client.setToken(null);
    }
  }

  private getStoredAccessToken(): string {
    return this._cookieService.get(this._accessTokenCookie);
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem(this._refreshTokenStorageKey);
  }

  private isAuthError(error: unknown): boolean {
    return this.isAuthHttpStatus(this.getErrorStatus(error));
  }

  private isAuthHttpStatus(status: number | undefined): boolean {
    return status === 401 || status === 403;
  }

  private getErrorStatus(error: unknown): number | undefined {
    if (!error || typeof error !== 'object') {
      return undefined;
    }

    const candidate = error as {
      status?: number;
      result?: { error?: { code?: number } };
    };

    if (typeof candidate.status === 'number') {
      return candidate.status;
    }

    return candidate.result?.error?.code;
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

  private deleteCookie(name: string): void {
    this._cookieService.delete(name, '/', undefined, false, 'Strict');
  }
}
