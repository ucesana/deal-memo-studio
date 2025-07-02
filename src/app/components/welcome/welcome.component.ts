import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { GoogleAuthService } from '../../services/google-auth.service';
import { MatButton } from '@angular/material/button';
import { AsyncPipe } from '@angular/common';

declare const anime: any;

@Component({
  selector: 'app-welcome',
  imports: [MatButton, AsyncPipe],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class WelcomeComponent implements OnInit, AfterViewInit {
  private readonly googleAuthService = inject(GoogleAuthService);

  isLoggedIn$ = this.googleAuthService.isLoggedInSubject.asObservable();

  ngOnInit(): void {
    if (this.googleAuthService.hasValidAccessToken()) {
      this.waitForGapi().then(() => {
        this.googleAuthService.initAccessToken();
      });
    }
    this.isLoggedIn$.subscribe((isLoggedIn) => {
      if (isLoggedIn) this.animateWelcome();
    });
  }

  ngAfterViewInit() {}

  public animateWelcome() {
    // Wrap every letter in a span
    var textWrapper = document.querySelector('.ml3');
    if (textWrapper) {
      textWrapper.innerHTML =
        textWrapper.textContent?.replace(
          /\S/g,
          "<span class='letter'>$&</span>",
        ) ?? '';

      anime.timeline({ loop: false }).add({
        targets: '.ml3 .letter',
        opacity: [0, 1],
        easing: 'easeInOutQuad',
        duration: 2250,
        delay: (el: any, i: number) => 150 * (i + 1),
      });
      // .add({
      //   targets: '.ml3',
      //   opacity: 0,
      //   duration: 1000,
      //   easing: 'easeOutExpo',
      //   delay: 1000,
      // });
    }
  }

  loginGoogle() {
    this.googleAuthService.login();
  }

  logoutGoogle() {
    this.googleAuthService.logout();
  }

  private waitForGapi(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).gapi) return resolve();
      const check = () => {
        if ((window as any).gapi) resolve();
        else setTimeout(check, 50);
      };
      check();
    });
  }
}
