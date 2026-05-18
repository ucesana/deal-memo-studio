import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
  MatTreeModule,
} from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { filter, finalize, take } from 'rxjs/operators';
import {
  DriveSearchQuery,
  GoogleDriveService,
} from '../../services/google-drive.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatToolbar } from '@angular/material/toolbar';
import { GoogleAuthService } from '../../services/google-auth.service';
import { AsyncPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FileIcon } from '../../common/components/file-icon/file-icon.component';
import { MatTooltip } from '@angular/material/tooltip';
import {
  areChildrenLoaded,
  FileNode,
  toFileNodes,
} from '../../common/classes/file-node';
import {
  ContextMenu,
  ContextMenuItem,
} from '../../common/components/context-menu/context-menu';
import { SnackService } from '../../common/services/snack.service';

export interface FlatTreeNode {
  id: string;
  name: string;
  type: string;
  icon: string;
  iconColor: string;
  warning: string | null;
  level: number;
  mimeType: string;
  expandable: boolean;
  file: gapi.client.drive.File;
}

@UntilDestroy()
@Component({
  selector: 'app-drive-tree',
  templateUrl: './drive-tree.component.html',
  styleUrl: './drive-tree.component.scss',
  imports: [
    MatTreeModule,
    MatButtonModule,
    MatIconModule,
    MatToolbar,
    AsyncPipe,
    MatProgressSpinner,
    FileIcon,
    MatTooltip,
    ContextMenu,
  ],
})
export class DriveTreeComponent implements OnInit {
  @Input() parentId: string = 'root';
  @Input() contextMenuItems: ContextMenuItem[] = [];
  @Input() searchQuery: DriveSearchQuery = {};
  @Input() height: string = 'calc(100vh - 64px)';
  @Output() select = new EventEmitter<FlatTreeNode>();

  @ViewChild('driveTreeContextMenu', { read: ContextMenu })
  driveTreeContextMenu!: ContextMenu;

  private readonly googleAuthService = inject(GoogleAuthService);
  private readonly googleDriveService = inject(GoogleDriveService);
  private readonly snackService = inject(SnackService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly expandedNodeIds = new Set<string>();
  private readonly loadingNodeIds = new Set<string>();

  public isLoggedIn$: Observable<boolean>;

  public treeControl: FlatTreeControl<FlatTreeNode>;
  public treeFlattener: MatTreeFlattener<FileNode, FlatTreeNode>;
  public dataSource: MatTreeFlatDataSource<FileNode, FlatTreeNode>;
  public contextMenuNode: any;
  public rootFolder: gapi.client.drive.File | null = null;
  public loaded: boolean = false;

  constructor() {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren,
    );

    this.treeControl = new FlatTreeControl(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener,
    );

    this.isLoggedIn$ = this.googleAuthService.getIsLoggedIn();
  }

  public ngOnInit(): void {
    this.isLoggedIn$
      .pipe(untilDestroyed(this))
      .subscribe((isLoggedIn: boolean) => {
        if (isLoggedIn) {
          this.loadRootFiles();
          this.googleDriveService
            .getFile(this.parentId)
            .pipe(filter((file) => !!file), untilDestroyed(this))
            .subscribe((file) => {
              this.rootFolder = file;
            });
        } else {
          this.resetTree();
        }
      });
  }

  public getLevel(node: FlatTreeNode): number {
    return node.level;
  }

  public isExpandable(node: FlatTreeNode): boolean {
    return node.expandable;
  }

  public hasChild(index: number, node: FlatTreeNode): boolean {
    return node.expandable;
  }

  public getChildren(node: FileNode): FileNode[] | undefined {
    return node.children;
  }

  public isExpanded(node: FlatTreeNode): boolean {
    return this.expandedNodeIds.has(node.id);
  }

  public isNodeLoading(nodeId: string): boolean {
    return this.loadingNodeIds.has(nodeId);
  }

  public refresh() {
    this.resetTree();
    this.loaded = false;
    this.googleAuthService
      .getIsLoggedIn()
      .pipe(take(1))
      .subscribe((isLoggedIn: boolean) => {
        if (isLoggedIn) {
          this.loadRootFiles();
        }
      });
  }

  public selectFile(flatTreeNode: FlatTreeNode): void {
    console.log('Selected node:', flatTreeNode);
    if (flatTreeNode.type === 'folder') {
      this.toggleFolderNode(flatTreeNode);
    }
    this.select.emit(flatTreeNode);
  }

  public toggleFolder(event: Event, flatTreeNode: FlatTreeNode): void {
    event.stopPropagation();
    this.toggleFolderNode(flatTreeNode);
  }

  public openContextMenu(node: FlatTreeNode, event: MouseEvent) {
    this.driveTreeContextMenu.open(node, event);
  }

  private resetTree(): void {
    this.dataSource.data = [];
    this.expandedNodeIds.clear();
    this.loadingNodeIds.clear();
    this.loaded = false;
  }

  private loadRootFiles() {
    this.googleDriveService
      .listFiles(this.searchBy(this.parentId ?? 'root', this.searchQuery))
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (files) => {
          this.expandedNodeIds.clear();
          this.dataSource.data = toFileNodes(files);
          this.loaded = true;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loaded = true;
          this.snackService.openSnackBar(
            'Failed to load files from Google Drive.',
            'Retry',
            () => this.loadRootFiles(),
          );
          this.cdr.markForCheck();
        },
      });
  }

  private toggleFolderNode(flatTreeNode: FlatTreeNode): void {
    const nodeId = flatTreeNode.id;

    if (this.expandedNodeIds.has(nodeId)) {
      this.expandedNodeIds.delete(nodeId);
      this.collapseTreeNodeById(nodeId);
      return;
    }

    const fileNode = this.findNode(nodeId, this.dataSource.data);
    if (!fileNode) {
      return;
    }

    this.expandedNodeIds.add(nodeId);

    if (areChildrenLoaded(fileNode)) {
      this.expandTreeNodeById(nodeId);
      return;
    }

    this.loadChildren(nodeId, fileNode);
  }

  private loadChildren(nodeId: string, fileNode: FileNode): void {
    if (this.loadingNodeIds.has(nodeId)) {
      return;
    }

    this.loadingNodeIds.add(nodeId);
    this.cdr.markForCheck();

    this.googleDriveService
      .listFiles(this.folderChildrenQuery(nodeId))
      .pipe(
        untilDestroyed(this),
        finalize(() => {
          this.loadingNodeIds.delete(nodeId);
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (files) => {
          if (!this.findNode(nodeId, this.dataSource.data)) {
            return;
          }
          fileNode.children = toFileNodes(files);
          this.refreshTreeData();
          this.restoreExpansionFromIds();
        },
        error: () => {
          this.expandedNodeIds.delete(nodeId);
          this.collapseTreeNodeById(nodeId);
          this.snackService.openSnackBar(
            'Failed to load folder contents.',
            'Retry',
            () => {
              if (this.findNode(nodeId, this.dataSource.data)) {
                this.expandedNodeIds.add(nodeId);
                this.loadChildren(nodeId, fileNode);
              }
            },
          );
        },
      });
  }

  private refreshTreeData(): void {
    this.dataSource.data = [...this.dataSource.data];
    this.cdr.markForCheck();
  }

  private restoreExpansionFromIds(): void {
    for (const nodeId of this.expandedNodeIds) {
      this.expandTreeNodeById(nodeId);
    }
  }

  private transformer(node: FileNode, level: number): FlatTreeNode {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      icon: node.icon,
      iconColor: node.iconColor,
      warning: node.warning,
      level,
      mimeType: node.mimeType,
      expandable: node.type === 'folder',
      file: node.file,
    };
  }

  private expandTreeNodeById(nodeId: string): void {
    const freshNode = this.treeControl.dataNodes.find(
      (currentNode) => currentNode.id === nodeId,
    );
    if (freshNode) {
      this.treeControl.expand(freshNode);
    }
  }

  private collapseTreeNodeById(nodeId: string): void {
    const freshNode = this.treeControl.dataNodes.find(
      (currentNode) => currentNode.id === nodeId,
    );
    if (freshNode) {
      this.treeControl.collapse(freshNode);
    }
  }

  private findNode(id: string, nodes: FileNode[]): FileNode | null {
    if (!nodes?.length) {
      return null;
    }
    const foundNode = nodes.find((node) => node.id === id);
    return foundNode
      ? foundNode
      : this.findNode(
          id,
          nodes.reduce((acc: FileNode[], val: FileNode) => {
            if (!areChildrenLoaded(val)) {
              return acc;
            }
            return [...acc, ...val.children!];
          }, []),
        );
  }

  private searchBy(
    parentId = 'root',
    query: DriveSearchQuery = {},
  ): { q: string } {
    return {
      q: this.googleDriveService.driveSearchQuery({
        ...query,
        parentId,
      }),
    };
  }

  /** List all items in a folder so navigation is not limited by root mime filters. */
  private folderChildrenQuery(parentId: string): { q: string } {
    return {
      q: this.googleDriveService.driveSearchQuery({ parentId }),
    };
  }
}
