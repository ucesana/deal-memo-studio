import { Component, inject, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { routes } from '../../app.routes';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { OverlayContainer } from '@angular/cdk/overlay';
import { GoogleAuthService } from '../../services/google-auth.service';
import { MatTooltip } from '@angular/material/tooltip';
import { ProgressBar } from '../../common/components/progress-bar/progress-bar';
import { DealMemoService } from '../../services/deal-memo.service';
import { MainToolbar } from '../main-toolbar/main-toolbar';

@Component({
  selector: 'app-layout',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    AsyncPipe,
    RouterLink,
    RouterLinkActive,
    MatTooltip,
    ProgressBar,
    RouterOutlet,
    MainToolbar,
  ],
})
export class DashboardComponent implements OnInit {
  private readonly _googleAuthService = inject(GoogleAuthService);
  private readonly _router = inject(Router);
  private readonly _dealMemoService = inject(DealMemoService);
  private readonly _breakpointObserver = inject(BreakpointObserver);

  public isLoggedIn$: Observable<boolean> =
    this._googleAuthService.isLoggedInSubject.asObservable();

  public appLoadProgress$: Observable<number>;

  public menuRoutes: any[] =
    routes
      .find((r) => r.path === 'dashboard')
      ?.children?.filter((r) => r.path && r.data?.['menu'])
      ?.filter((r) => !!r) ?? [];

  isHandset$: Observable<boolean> = this._breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay(),
    );

  constructor() {
    this.appLoadProgress$ = this._dealMemoService.getAppLoadProgress();
  }

  public ngOnInit(): void {
    this._googleAuthService.getIsLoggedIn().subscribe((isLoggedIn) => {
      if (isLoggedIn) {
        this._dealMemoService.loadOrCreateAppData();
        this._router.navigate(['/dashboard/login']).then();
      }
    });

    if (this._googleAuthService.isAccessTokenExpired()) {
      this._googleAuthService.openLoginSnack();
      this._router.navigate(['/dashboard/login']).then();
    }
  }

  public createNewDealMemos() {
    this._router.navigate(['/dashboard/create-deal-memos/new']).then();
  }
}
