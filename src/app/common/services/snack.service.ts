import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SnackService {
  private readonly _duration = 6000;

  private _snackBar = inject(MatSnackBar);

  constructor() {}

  openSnackBar(message: string, action?: string, p0?: () => void) {
    const snackBar = this._snackBar.open(message, action, {
      duration: this._duration,
    });
    if (p0) {
      snackBar.onAction().subscribe(p0);
    }
  }
}
