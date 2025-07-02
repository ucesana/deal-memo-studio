import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
  selector: 'app-progress-bar',
  imports: [MatProgressBar],
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss',
})
export class ProgressBar implements OnChanges {
  @Input({ transform: (value: number | null): number => value ?? 0 })
  public progress: number = 0;

  public fading = false;
  public hide = false;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['progress']) {
      const progress: number = +changes['progress'].currentValue;
      if (progress < 0) {
        this.hide = false;
      }
      this.fading = progress === 100;
      if (this.fading) {
        setTimeout(() => {
          this.hide = true;
        }, 1000);
      }
    }
  }
}
