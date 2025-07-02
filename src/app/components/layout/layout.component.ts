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
import { RouterLink, RouterLinkActive } from '@angular/router';
import { routes } from '../../app.routes';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { OverlayContainer } from '@angular/cdk/overlay';
import { GoogleAuthService } from '../../services/google-auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    AsyncPipe,
    RouterLink,
    RouterLinkActive,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
  ],
})
export class LayoutComponent implements OnInit {
  private readonly googleAuthService = inject(GoogleAuthService);
  private readonly overlayContainer = inject(OverlayContainer);

  public isLoggedIn$: Observable<boolean> =
    this.googleAuthService.isLoggedInSubject.asObservable();

  private _breakpointObserver = inject(BreakpointObserver);

  public title = 'Deal Memo Studio';
  public isLightTheme = true;
  public rootRoutes = routes.filter((r) => r.path && r.data?.['menu']);

  isHandset$: Observable<boolean> = this._breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay(),
    );
  isPanelOpen = false;

  ngOnInit(): void {}

  toggleTheme() {
    this.isLightTheme = !this.isLightTheme;
    document.body.classList.remove('light-theme', 'dark-theme');
    this.overlayContainer
      .getContainerElement()
      .classList.remove('light-theme', 'dark-theme');
    const theme = this.isLightTheme ? 'light-theme' : 'dark-theme';
    document.body.classList.add(theme);
    this.overlayContainer.getContainerElement().classList.add(theme);
  }

  loginGoogle() {
    this.googleAuthService.login();
  }

  logoutGoogle() {
    this.googleAuthService.logout();
  }
}
