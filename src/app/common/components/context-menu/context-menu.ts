import {
  Component,
  HostListener,
  inject,
  Input,
  OnDestroy,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

export interface ContextMenuItem {
  condition: (item: any) => boolean;
  label: string;
  action: (item: any) => void;
}

@Component({
  selector: 'app-context-menu',
  imports: [CommonModule, MatButtonModule],
  template: `
    <ng-template #contextMenuTemplate>
      <div class="context-menu">
        @for (item of filteredMenuItems; track item) {
          <button
            mat-menu-item
            (click)="executeAction(item)"
            class="context-menu-item"
          >
            {{ item.label }}
          </button>
        }
      </div>
    </ng-template>
  `,
  styles: [
    `
      .context-menu {
        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        padding: 8px 0;
        min-width: 160px;
      }

      .context-menu-item {
        width: 100%;
        text-align: left;
        border: none;
        background: none;
        padding: 12px 16px;
        cursor: pointer;
        font-family: inherit;
        font-size: 14px;
      }

      .context-menu-item:hover {
        background-color: #f5f5f5;
      }
    `,
  ],
})
export class ContextMenu implements OnDestroy {
  @Input() contextMenuItems: ContextMenuItem[] = [];

  @ViewChild('contextMenuTemplate', { read: TemplateRef })
  contextMenuTemplate!: TemplateRef<any>;

  @HostListener('document:click', ['$event'])
  @HostListener('document:contextmenu', ['$event'])
  public onDocumentClick(event: MouseEvent) {
    if (event.type === 'contextmenu') {
      event.preventDefault();
    }
    this.close();
  }

  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;

  public selectedContextMenuItem: any = null;
  public filteredMenuItems: ContextMenuItem[] = [];

  public open(item: any, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.close();

    this.selectedContextMenuItem = item;
    this.filteredMenuItems = this.contextMenuItems.filter((menuItem) =>
      menuItem.condition(item),
    );

    if (this.filteredMenuItems.length === 0) {
      return;
    }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo({ x: event.clientX, y: event.clientY })
      .withPositions([
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'end',
          overlayY: 'top',
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });

    const portal = new TemplatePortal(
      this.contextMenuTemplate,
      this.viewContainerRef,
    );

    this.overlayRef.attach(portal);

    this.overlayRef.backdropClick().subscribe(() => this.close());
  }

  public executeAction(menuItem: ContextMenuItem): void {
    if (this.selectedContextMenuItem) {
      menuItem.action(this.selectedContextMenuItem);
    }
    this.close();
  }

  public close(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  ngOnDestroy(): void {
    this.close();
  }
}
