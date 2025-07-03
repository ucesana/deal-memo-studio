import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MainToolbar } from '../main-toolbar/main-toolbar';
import { GoogleAuthService } from '../../services/google-auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [RouterLink, RouterOutlet, MainToolbar],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly _googleAuthService = inject(GoogleAuthService);

  public isLoggedIn$: Observable<boolean> =
    this._googleAuthService.isLoggedInSubject.asObservable();

  login() {
    this._googleAuthService.login();
  }
}
