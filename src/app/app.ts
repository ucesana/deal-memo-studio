import {
  Component,
  HostListener,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { GoogleAuthService } from './services/google-auth.service';
import { DealMemoService } from './services/deal-memo.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ProgressBar } from './common/components/progress-bar/progress-bar';
import { MatIcon } from '@angular/material/icon';
import { MatFabButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    LayoutComponent,
    AsyncPipe,
    ProgressBar,
    MatIcon,
    MatFabButton,
    MatTooltip,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  @ViewChild('outlet') outlet!: RouterOutlet;

  private readonly _googleAuthService = inject(GoogleAuthService);
  private readonly _dealMemoService = inject(DealMemoService);
  private readonly _router = inject(Router);

  @HostListener('document:contextmenu', ['$event'])
  public onGlobalRightClick(event: MouseEvent) {
    event.preventDefault();
  }

  public appLoadProgress$: Observable<number>;

  constructor() {
    this.appLoadProgress$ = this._dealMemoService.getAppLoadProgress();
  }

  public ngOnInit(): void {
    this._googleAuthService.getIsLoggedIn().subscribe((isLoggedIn) => {
      if (isLoggedIn) {
        this._dealMemoService.loadOrCreateAppData();
      } else {
        this._router.navigate(['/welcome']).then();
      }
    });
  }

  public createNewDealMemos() {
    this._router.navigate(['/create-deal-memos/new']).then();
  }
}
