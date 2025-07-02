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
import {
  DriveSearchQuery,
  GoogleDriveService,
} from '../../services/google-drive.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatToolbar } from '@angular/material/toolbar';
import { GoogleAuthService } from '../../services/google-auth.service';
import { filter, take } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FileIcon } from '../../common/components/file-icon/file-icon.component';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { FileNode, toFileNodes } from '../../common/classes/file-node';
import {
  ContextMenu,
  ContextMenuItem,
} from '../../common/components/context-menu/context-menu';

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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);

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
    this.parentId = this.route.snapshot.paramMap.get('parentId') || 'root';

    this.isLoggedIn$
      .pipe(untilDestroyed(this))
      .subscribe((isLoggedIn: boolean) => {
        if (isLoggedIn) {
          this.loadRootFiles();
          this.googleDriveService
            .getFile(this.parentId)
            .pipe(filter((o) => !!o))
            .subscribe((file) => {
              this.rootFolder = file;
            });
        } else {
          this.dataSource.data = [];
          this.loaded = false;
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

  public getChildren(node: FileNode): FileNode[] | null | undefined {
    return node.children;
  }

  public refresh() {
    this.dataSource.data = [];
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
    switch (flatTreeNode.type) {
      case 'folder':
        this.selectFolder(flatTreeNode);
        break;
    }
    this.select.emit(flatTreeNode);
  }

  public toggleFolder(flatTreeNode: FlatTreeNode) {
    if (this.treeControl.isExpanded(flatTreeNode)) {
      return;
    }
    const fileNode = this.findNode(flatTreeNode.id, this.dataSource.data);
    if (!fileNode) {
      return;
    }
    if (fileNode.children?.length) {
      // children already loaded, nothing to do
      return;
    }
    this.loadChildren(flatTreeNode, fileNode);
  }

  public openContextMenu(node: FlatTreeNode, event: any) {
    this.driveTreeContextMenu.open(node, event);
  }

  private loadRootFiles() {
    this.googleDriveService
      .listFiles(this.searchBy(this.parentId ?? 'root', this.searchQuery))
      .subscribe((files) => {
        this.dataSource.data = toFileNodes(files);
        this.loaded = true;
        this.cdr.markForCheck();
      });
  }

  private getRootId(files: gapi.client.drive.File[]): string | null {
    const rootFolderIds: Set<string> = files
      .filter((item) => item.parents?.length === 1)
      .reduce((acc, item) => {
        if (item.parents) {
          acc.add(item.parents[0]);
        }
        return acc;
      }, new Set<string>());
    return rootFolderIds.values().next().value || null;
  }

  private getRootFolder(
    files: gapi.client.drive.File[],
  ): gapi.client.drive.File | null {
    const rootId = this.getRootId(files);
    return files.find((f) => f.id === rootId) || null;
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
      expandable: !!node.children,
      file: node.file,
    };
  }

  private selectFolder(flatTreeNode: FlatTreeNode) {
    if (this.treeControl.isExpanded(flatTreeNode)) {
      this.treeControl.collapse(flatTreeNode);
      return;
    }
    const fileNode = this.findNode(flatTreeNode.id, this.dataSource.data);
    if (!fileNode) {
      return;
    }
    if (fileNode.children?.length) {
      // children already loaded but is not expanded
      this.expandTreeNode(flatTreeNode);
      return;
    }
    this.loadChildren(flatTreeNode, fileNode);
  }

  private loadChildren(
    flatTreeNode: FlatTreeNode | null,
    fileNode: FileNode | null,
  ) {
    if (!flatTreeNode || !fileNode || flatTreeNode.id !== fileNode.id) {
      return;
    }
    this.googleDriveService
      .listFiles(this.searchBy(flatTreeNode.id, this.searchQuery))
      .subscribe((files) => {
        const expandedDataNodes = this.treeControl.dataNodes.filter((node) =>
          this.treeControl.isExpanded(node),
        );

        fileNode.children = toFileNodes(files);
        this.dataSource.data = [...this.dataSource.data];

        expandedDataNodes
          .map((expandedNode) =>
            this.treeControl.dataNodes.find(
              (currentNode) => currentNode.id === expandedNode.id,
            ),
          )
          .filter((node) => !!node)
          .forEach((node) => {
            this.treeControl.expand(node);
          });
        this.expandTreeNode(flatTreeNode);
      });
  }

  private expandTreeNode(node: FlatTreeNode): void {
    const freshNode = this.treeControl.dataNodes.find(
      (currentNode) => currentNode.id === node.id,
    );
    if (freshNode) {
      this.treeControl.expand(freshNode);
    }
  }

  private collapseTreeNode(node: FlatTreeNode): void {
    const freshNode = this.treeControl.dataNodes.find(
      (currentNode) => currentNode.id === node.id,
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
          nodes.reduce(
            (acc: FileNode[], val: FileNode) => [
              ...acc,
              ...(val.children ?? []),
            ],
            [],
          ),
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
}
