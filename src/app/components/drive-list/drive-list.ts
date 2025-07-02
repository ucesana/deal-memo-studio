import {
  Component,
  inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { PathBreadcrumb } from '../../common/components/path-breadcrumb/path-breadcrumb';
import { FileIcon } from '../../common/components/file-icon/file-icon.component';
import { GoogleDriveService } from '../../services/google-drive.service';
import { FileNode, toFileNodes } from '../../common/classes/file-node';
import { alphanumericSort } from '../../common/functions/sort-util';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import {
  ContextMenu,
  ContextMenuItem,
} from '../../common/components/context-menu/context-menu';
import { DriveContextMenuService } from '../../services/drive-context-menu.service';

@Component({
  selector: 'app-drive-list',
  imports: [PathBreadcrumb, FileIcon, AsyncPipe, ContextMenu],
  templateUrl: './drive-list.html',
  styleUrl: './drive-list.scss',
})
export class DriveList implements OnInit, OnDestroy {
  private readonly _router: Router = inject(Router);
  private readonly _googleDriveService: GoogleDriveService =
    inject(GoogleDriveService);
  private readonly _driveContextMenuService: DriveContextMenuService = inject(
    DriveContextMenuService,
  );

  @Input() path: { name: string; id: string }[] = [];
  @Input() contextMenuItems: ContextMenuItem[] = [];

  @ViewChild('driveTreeContextMenu', { read: ContextMenu })
  driveTreeContextMenu!: ContextMenu;

  nodesSubject = new BehaviorSubject<FileNode[]>([]);
  nodes$: Observable<FileNode[]> = this.nodesSubject.asObservable();

  ngOnInit() {
    const folderId =
      this.path.length > 0 ? this.path[this.path.length - 1].id : null;

    if (folderId) {
      this._googleDriveService
        .listFiles({
          q: this._googleDriveService.driveSearchQuery({ parentId: folderId }),
        })
        .subscribe((files) => {
          this.nodesSubject.next(
            toFileNodes(files.sort((a, b) => alphanumericSort(a.name, b.name))),
          );
        });
    }
  }

  ngOnDestroy() {
    this.nodesSubject?.unsubscribe();
  }

  public selectFile(node: FileNode): void {
    this._driveContextMenuService.openFileAction(node);
  }

  public openContextMenu(node: any, event: any): void {
    this.driveTreeContextMenu.open(node, event);
  }
}
