import { Injectable } from '@angular/core';

declare const gapi: any;

/** Dispatched from index.html when apis.google.com/js/api.js finishes loading. */
export const GAPI_SCRIPT_LOADED_EVENT = 'gapi-script-loaded';

const SCRIPT_LOAD_TIMEOUT_MS = 30_000;

@Injectable({
  providedIn: 'root',
})
export class GapiLoaderService {
  private scriptReady: Promise<void> | null = null;
  private clientReady: Promise<void> | null = null;

  /** Resolves when the GAPI bootstrap script (api.js) has loaded. */
  whenScriptLoaded(): Promise<void> {
    if (!this.scriptReady) {
      this.scriptReady = new Promise((resolve, reject) => {
        if (typeof gapi !== 'undefined') {
          resolve();
          return;
        }

        const timeoutId = setTimeout(() => {
          window.removeEventListener(GAPI_SCRIPT_LOADED_EVENT, onScriptLoaded);
          reject(new Error('Timed out waiting for the GAPI script to load.'));
        }, SCRIPT_LOAD_TIMEOUT_MS);

        const onScriptLoaded = () => {
          clearTimeout(timeoutId);
          resolve();
        };

        window.addEventListener(
          GAPI_SCRIPT_LOADED_EVENT,
          onScriptLoaded,
          { once: true },
        );
      });
    }
    return this.scriptReady;
  }

  /** Resolves when gapi.load('client') has completed (idempotent). */
  whenClientLoaded(): Promise<void> {
    if (!this.clientReady) {
      this.clientReady = this.whenScriptLoaded().then(
        () =>
          new Promise((resolve, reject) => {
            gapi.load('client', {
              callback: () => resolve(),
              onerror: () =>
                reject(new Error('Failed to load the GAPI client library.')),
            });
          }),
      );
    }
    return this.clientReady;
  }
}
