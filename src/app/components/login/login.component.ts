import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleAuthService } from '../../services/google-auth.service';
import { MatButton } from '@angular/material/button';
import { AsyncPipe } from '@angular/common';
import { filter, take } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-welcome',
  imports: [MatButton, AsyncPipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, AfterViewInit {
  private readonly googleAuthService = inject(GoogleAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isLoggedIn$ = this.googleAuthService.isLoggedInSubject.asObservable();

  ngOnInit(): void {
    this.googleAuthService
      .getIsLoggedIn()
      .pipe(
        filter((isLoggedIn) => isLoggedIn),
        take(1),
        untilDestroyed(this),
      )
      .subscribe(() => {
        const returnUrl =
          this.route.snapshot.queryParamMap.get('returnUrl') ??
          '/dashboard/create-deal-memos';
        this.router.navigateByUrl(returnUrl);
      });
  }

  ngAfterViewInit() {}

  loginGoogle() {
    this.googleAuthService.login();
  }

  logoutGoogle() {
    this.googleAuthService.logout();
  }
}
