import { Component, inject, Input } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { MatSidenav } from '@angular/material/sidenav';
import { Router, RouterLink } from '@angular/router';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { GoogleAuthService } from '../../services/google-auth.service';
import { MatIcon } from '@angular/material/icon';
import { OverlayContainer } from '@angular/cdk/overlay';
import { AppSettingsService } from '../../services/app-settings.service';

@Component({
  selector: 'app-main-toolbar',
  imports: [
    AsyncPipe,
    MatToolbar,
    MatIconButton,
    MatIcon,
    RouterLink,
    MatMenuTrigger,
    MatMenuItem,
    MatMenu,
  ],
  templateUrl: './main-toolbar.html',
  styleUrl: './main-toolbar.scss',
})
export class MainToolbar {
  @Input() drawer!: MatSidenav;

  public theme: 'light-theme' | 'dark-theme' = 'light-theme';

  private readonly _googleAuthService = inject(GoogleAuthService);
  private readonly _breakpointObserver = inject(BreakpointObserver);
  private readonly _appSettingsService = inject(AppSettingsService);

  public isLoggedIn$: Observable<boolean> =
    this._googleAuthService.getIsLoggedIn();

  public isHandset$: Observable<boolean> = this._breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay(),
    );

  constructor() {
    this.theme = this._appSettingsService.getTheme();
  }

  public toggleTheme() {
    this._appSettingsService.toggleTheme();
  }

  public loginGoogle() {
    this._googleAuthService.login();
  }

  public logoutGoogle() {
    this._googleAuthService.logout();
  }
}
