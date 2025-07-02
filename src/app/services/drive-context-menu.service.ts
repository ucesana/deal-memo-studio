import { inject, Injectable } from '@angular/core';
import { ContextMenuItem } from '../common/components/context-menu/context-menu';
import { FlatTreeNode } from '../components/drive-tree/drive-tree.component';
import { Router } from '@angular/router';
import { GoogleDriveService } from './google-drive.service';
import { FileNode } from '../common/classes/file-node';

@Injectable({
  providedIn: 'root',
})
export class DriveContextMenuService {
  private readonly _router = inject(Router);
  private readonly _googleDriveService = inject(GoogleDriveService);

  constructor() {}

  public openFile(): ContextMenuItem {
    return {
      label: 'Open',
      condition: this.validFile(),
      action: this.openFileAction,
    };
  }

  public readonly openFileAction = (node: FileNode) => {
    switch (node.mimeType) {
      case 'application/vnd.google-apps.document':
        this._router.navigate(['/docs', node.id]).then((_) => {});
        break;
      case 'application/vnd.google-apps.spreadsheet':
        this._router.navigate(['/spreadsheets', node.id]).then((_) => {});
        break;
      case 'application/pdf':
        this._router.navigate(['/pdf', node.id]).then((_) => {});
        break;
      case 'application/vnd.google-apps.folder':
        this._router.navigate(['/drive', node.id]).then((_) => {});
        break;
    }
  };

  private validFile() {
    return (node: FileNode) =>
      [
        'application/vnd.google-apps.folder',
        'application/vnd.google-apps.document',
        'application/vnd.google-apps.spreadsheet',
        'application/vnd.oasis.opendocument.text',
        'application/pdf',
      ].includes(node.mimeType);
  }

  openInGoogleDrive(): ContextMenuItem {
    return {
      label: 'Open in Google Drive',
      condition: this.validFile(),
      action: (node: FileNode) => {
        switch (node.mimeType) {
          case 'application/vnd.google-apps.document':
            window.open(
              `https://docs.google.com/document/d/${node.id}`,
              '_blank',
            );
            break;
          case 'application/vnd.google-apps.spreadsheet':
            window.open(
              `https://docs.google.com/spreadsheets/d/${node.id}`,
              '_blank',
            );
            break;
          case 'application/vnd.google-apps.folder':
            window.open(
              `https://drive.google.com/drive/folders/${node.id}`,
              '_blank',
            );
            break;
          case 'application/pdf':
            window.open(`https://drive.google.com/file/d/${node.id}`, '_blank');
            break;
          default:
            window.open(`https://drive.google.com/file/d/${node.id}`, '_blank');
        }
      },
    };
  }

  saveAsGoogleDoc(
    resultFn: (result: gapi.client.drive.File) => void = (_) => {},
  ): ContextMenuItem {
    return {
      label: 'Save as Google Doc',
      condition: (node: FileNode) =>
        node.mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      action: (node: FileNode) => {
        this._googleDriveService
          .saveAsGoogleDocAndOpenSpinnerDialog(node.id)
          .subscribe((file: gapi.client.drive.File) => resultFn(file));
      },
    };
  }
}
