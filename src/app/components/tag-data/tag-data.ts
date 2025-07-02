import { Component, Input, OnInit, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DocumentTagData } from '../../services/tag.service';
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
export class TagData implements OnInit {
  @Input() data!: DocumentTagData;
  accordion = viewChild.required(MatAccordion);

  constructor() {}

  ngOnInit(): void {}
}
