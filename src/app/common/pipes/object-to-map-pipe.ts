import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'objectToMap',
  standalone: true,
})
export class ObjectToMapPipe implements PipeTransform {
  transform(obj: object | null): Map<string, any> {
    return obj ? new Map(Object.entries(obj)) : new Map();
  }
}
