import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import {LayoutComponent} from './layout/layout.component';

@Component({
  selector: "app-root",
  imports: [RouterOutlet, LayoutComponent],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class App {
  protected title = "deal-memo";
}
