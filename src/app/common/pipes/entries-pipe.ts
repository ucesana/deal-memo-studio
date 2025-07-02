import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'entries',
  standalone: true,
})
export class EntriesPipe implements PipeTransform {
  transform(obj: object | null): [string, any][] {
    return obj ? Object.entries(obj) : [];
  }
}
