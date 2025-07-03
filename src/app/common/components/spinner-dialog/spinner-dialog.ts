import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-spinner-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatProgressSpinner],
  templateUrl: './spinner-dialog.html',
  styleUrl: './spinner-dialog.scss',
})
export class SpinnerDialog {
  data = inject(MAT_DIALOG_DATA);
}
