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

  private readonly _googleAuthService = inject(GoogleAuthService);
  private readonly _overlayContainer = inject(OverlayContainer);
  private readonly _breakpointObserver = inject(BreakpointObserver);
  private readonly _router = inject(Router);

  public isLoggedIn$: Observable<boolean> =
    this._googleAuthService.getIsLoggedIn();

  public isLightTheme = true;

  public isHandset$: Observable<boolean> = this._breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay(),
    );

  public toggleTheme() {
    this.isLightTheme = !this.isLightTheme;
    document.body.classList.remove('light-theme', 'dark-theme');
    this._overlayContainer
      .getContainerElement()
      .classList.remove('light-theme', 'dark-theme');
    const theme = this.isLightTheme ? 'light-theme' : 'dark-theme';
    document.body.classList.add(theme);
    this._overlayContainer.getContainerElement().classList.add(theme);
  }

  public loginGoogle() {
    this._googleAuthService.login();
  }

  public logoutGoogle() {
    this._googleAuthService.logout();
  }
}
