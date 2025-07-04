import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  DocumentTagData,
  TagData as TagDataType,
} from '../../services/tag.service';
import { MatChip } from '@angular/material/chips';
import { MatTooltip } from '@angular/material/tooltip';
import { TagValuePipe } from '../../pipes/tag-value-pipe';

@Component({
  selector: 'app-tag-data',
  imports: [
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatChip,
    MatTooltip,
    TagValuePipe,
  ],
  templateUrl: './tag-data.html',
  styleUrl: './tag-data.scss',
})
export class TagData implements OnInit, OnChanges {
  @Input() data!: DocumentTagData;
  accordion = viewChild.required(MatAccordion);

  public totalDealMemos: number = 0;
  public totalTags: number = 0;

  constructor() {
    if (this.data?.length) {
      this.totalDealMemos = this.data?.length ?? 0;
      this.totalTags = this.data?.[0]?.length ?? 0;
    }
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    const data = changes['data']?.currentValue as DocumentTagData;
    this.totalDealMemos = data?.length ?? 0;
    this.totalTags = data?.[0]?.length ?? 0;
  }
}
