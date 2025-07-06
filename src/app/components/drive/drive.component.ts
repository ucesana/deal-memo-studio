import { Component, inject, Input, ViewChild } from '@angular/core';
import {
  DriveTreeComponent,
  FlatTreeNode,
} from '../drive-tree/drive-tree.component';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackService } from '../../common/services/snack.service';
import {
  DriveSearchQuery,
  GoogleDriveService,
} from '../../services/google-drive.service';
import { ContextMenuItem } from '../../common/components/context-menu/context-menu';
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
  private readonly _route = inject(ActivatedRoute);
  private readonly _snackService = inject(SnackService);
  private readonly _googleDriveService = inject(GoogleDriveService);
  private readonly _driveContextMenuService = inject(DriveContextMenuService);

  public parentId: string | null = null;

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

  constructor() {
    const id = this._route.snapshot.params['id'];
    if (id?.length > 0) {
      this.parentId = id;
    } else {
      this.parentId = 'root';
    }
    this.contextMenuItems = [
      this._driveContextMenuService.openInGoogleDrive(),
      this._driveContextMenuService.saveAsGoogleDoc((file) =>
        this._router.navigate(['/dashboard/docs', file.id]),
      ),
      this._driveContextMenuService.saveAsDocx((file) =>
        this._router.navigate(['/dashboard/docs', file.id]),
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
                this._router.navigate(['/dashboard/docs', file.id]),
              )
              .action(node),
        );
        break;
      default:
        this._driveContextMenuService.openFileAction(node);
    }
  }
}
