import { Component, inject, ViewChild } from '@angular/core';
import {
  DriveTreeComponent,
  FlatTreeNode,
} from '../drive-tree/drive-tree.component';
import { Router } from '@angular/router';
import { SnackService } from '../../common/services/snack.service';
import {
  DriveSearchQuery,
  GoogleDriveService,
} from '../../services/google-drive.service';
import { ContextMenuItem } from '../../common/components/context-menu/context-menu';
import { MatDialog } from '@angular/material/dialog';
import { SpinnerDialog } from '../../common/components/spinner-dialog/spinner-dialog';
import { Observable } from 'rxjs';
import { MatTable } from '@angular/material/table';
import { TableItem } from '../sheet-tab/table-datasource';
import { DriveContextMenuService } from '../../services/drive-context-menu.service';

@Component({
  selector: 'app-drive',
  imports: [DriveTreeComponent],
  templateUrl: './drive.component.html',
  styleUrl: './drive.component.scss',
})
export class DriveComponent {
  @ViewChild('driveTree') driveTree!: DriveTreeComponent;

  private readonly _router = inject(Router);
  private readonly _snackService = inject(SnackService);
  private readonly _googleDriveService = inject(GoogleDriveService);
  private readonly _driveContextMenuService = inject(DriveContextMenuService);

  public contextMenuItems: ContextMenuItem[] = [];
  public searchQuery: DriveSearchQuery = {
    mimeTypes: [
      'application/vnd.google-apps.folder',
      'application/vnd.google-apps.document',
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
    ],
  };
  public parentId: string = 'root';

  constructor() {
    this.contextMenuItems = [
      this._driveContextMenuService.openInGoogleDrive(),
      this._driveContextMenuService.saveAsGoogleDoc((file) =>
        this._router.navigate(['/docs', file.id]),
      ),
    ];
  }

  public select(node: FlatTreeNode): void {
    switch (node.mimeType) {
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        this._snackService.openSnackBar(
          'Cannot open word document. Save it as Google Doc first, then try again.',
          'Save as Google Doc',
          () =>
            this._driveContextMenuService
              .saveAsGoogleDoc((file) =>
                this._router.navigate(['/docs', file.id]),
              )
              .action(node),
        );
        break;
      default:
        this._driveContextMenuService.openFileAction(node);
    }
  }
}
