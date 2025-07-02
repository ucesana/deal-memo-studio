import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {
  DriveTreeComponent,
  FlatTreeNode,
} from '../drive-tree/drive-tree.component';
import {
  DriveSearchQuery,
  GoogleDriveService,
} from '../../services/google-drive.service';
import { ContextMenuItem } from '../../common/components/context-menu/context-menu';
import { Router } from '@angular/router';
import { MatTable } from '@angular/material/table';
import { TableItem } from '../sheet-tab/table-datasource';
import { SnackService } from '../../common/services/snack.service';
import { DriveContextMenuService } from '../../services/drive-context-menu.service';

@Component({
  selector: 'app-drive-selector',
  imports: [DriveTreeComponent],
  templateUrl: './drive-selector.component.html',
  styleUrl: './drive-selector.component.scss',
})
export class DriveSelectorComponent {
  private readonly _driveContextMenuService: DriveContextMenuService = inject(
    DriveContextMenuService,
  );
  private readonly _googleDriveService: GoogleDriveService =
    inject(GoogleDriveService);
  private readonly _snackService: SnackService = inject(SnackService);

  @Input() public parentId: string = 'root';
  @Output() public selectedFile: EventEmitter<gapi.client.drive.File> =
    new EventEmitter();

  @ViewChild(DriveTreeComponent) public driveTree!: DriveTreeComponent;

  public searchQuery: DriveSearchQuery = {
    mimeTypes: [
      'application/vnd.google-apps.folder',
      'application/vnd.google-apps.document',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  };

  public contextMenuItems: ContextMenuItem[] = [];

  constructor() {
    this.contextMenuItems = [
      this._driveContextMenuService.openInGoogleDrive(),
      this._driveContextMenuService.saveAsGoogleDoc((_) =>
        this.driveTree.refresh(),
      ),
    ];
  }

  public select(node: FlatTreeNode): void {
    switch (node.mimeType) {
      case 'application/vnd.google-apps.document':
        this.selectedFile.emit(node.file);
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        this._snackService.openSnackBar(
          'Cannot select this template. Save it as Google Doc first, then try again.',
          'Save as Google Doc',
          () => {
            this._googleDriveService
              .saveAsGoogleDocAndOpenSpinnerDialog(node.id)
              .subscribe((_) => this.driveTree.refresh());
          },
        );
        break;
    }
  }
}
