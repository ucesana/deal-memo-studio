import { Component, HostListener, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GoogleAuthService } from './services/google-auth.service';
import { MatSidenavContainer } from '@angular/material/sidenav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSidenavContainer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly _googleAuthService = inject(GoogleAuthService);

  @HostListener('document:contextmenu', ['$event'])
  public onGlobalRightClick(event: MouseEvent) {
    event.preventDefault();
  }

  ngOnInit() {
    if (this._googleAuthService.isAccessTokenNotExpired()) {
      this._googleAuthService.waitForGapi().then(() => {
        this._googleAuthService.initAccessToken();
      });
    }
  }
}
