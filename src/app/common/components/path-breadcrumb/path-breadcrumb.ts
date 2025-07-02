import { Component, inject, Input, ViewChild } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContextMenu, ContextMenuItem } from '../context-menu/context-menu';
import { DriveContextMenuService } from '../../../services/drive-context-menu.service';

@Component({
  selector: 'app-path-breadcrumb',
  imports: [MatCard, MatIcon, NgClass, RouterLink, ContextMenu],
  templateUrl: './path-breadcrumb.html',
  styleUrl: './path-breadcrumb.scss',
})
export class PathBreadcrumb {
  private readonly _driveContextMenuService = inject(DriveContextMenuService);

  @Input() path: { name: string; id: string }[] = [];

  @ViewChild('driveTreeContextMenu') contextMenu!: ContextMenu;

  contextMenuItems: ContextMenuItem[];

  constructor() {
    this.contextMenuItems = [
      this._driveContextMenuService.openFile(),
      this._driveContextMenuService.openInGoogleDrive(),
    ];
  }

  get pathParts() {
    return this.path;
  }

  openContextMenu(id: string, event: MouseEvent): void {
    this.contextMenu.open(
      { id, mimeType: 'application/vnd.google-apps.folder' },
      event,
    );
  }
}
