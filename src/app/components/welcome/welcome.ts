import { AfterViewInit, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

declare const anime: any;

@Component({
  selector: 'app-welcome',
  imports: [RouterLink],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
})
export class Welcome implements AfterViewInit {
  ngAfterViewInit() {
    this.animateFadeInByLetter('.welcome-title');
    this.animateFade('.welcome-subtitle');
  }

  public animateFadeInByLetter(selector: string) {
    const text = document.querySelector(selector);
    if (text) {
      text.innerHTML =
        text.textContent?.replace(/\S/g, "<span class='letter'>$&</span>") ??
        '';

      anime.timeline({ loop: false }).add({
        targets: `${selector} .letter`,
        opacity: [0, 1],
        easing: 'easeInOutQuad',
        duration: 500,
        delay: (el: any, i: number) => 100 * (i + 1),
      });
    }
  }

  public animateFade(selector: string) {
    const text = document.querySelector(selector);
    if (text) {
      anime.timeline({ loop: false }).add({
        targets: `${selector}`,
        opacity: [0, 1],
        easing: 'easeInOutQuad',
        duration: 1000,
        delay: (el: any, i: number) => 500 + 100 * 20,
      });
    }
  }
}
