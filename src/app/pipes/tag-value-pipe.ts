import { Pipe, PipeTransform } from '@angular/core';
import { getTagValue, TagData } from '../services/tag.service';

@Pipe({
  name: 'tagValue',
})
export class TagValuePipe implements PipeTransform {
  transform(tagData: TagData, tagName: string, defaualtValue?: string): string {
    return getTagValue(tagData, tagName, defaualtValue);
  }
}
