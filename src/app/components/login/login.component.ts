import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { GoogleAuthService } from '../../services/google-auth.service';
import { MatButton } from '@angular/material/button';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-welcome',
  imports: [MatButton, AsyncPipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, AfterViewInit {
  private readonly googleAuthService = inject(GoogleAuthService);

  isLoggedIn$ = this.googleAuthService.isLoggedInSubject.asObservable();

  ngOnInit(): void {}

  ngAfterViewInit() {}

  loginGoogle() {
    this.googleAuthService.login();
  }

  logoutGoogle() {
    this.googleAuthService.logout();
  }
}
