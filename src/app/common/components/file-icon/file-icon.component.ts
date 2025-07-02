import { Component, Input } from '@angular/core';
import { MatBadge } from '@angular/material/badge';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { NgTemplateOutlet } from '@angular/common';
import { FileNode } from '../../classes/file-node';

@Component({
  selector: 'app-file-icon',
  imports: [MatBadge, MatIcon, MatTooltip, NgTemplateOutlet],
  templateUrl: './file-icon.component.html',
  styleUrl: './file-icon.component.scss',
})
export class FileIcon {
  @Input() node!: FileNode;
}
