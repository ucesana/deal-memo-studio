import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import { Observable, merge, BehaviorSubject, Subject } from 'rxjs';
import { alphanumericSort } from '../../common/functions/sort-util';

export type TableItem = Record<string, string>;

export class TableDataSource extends DataSource<TableItem> {
  data: TableItem[] = [];
  dataSubject: Subject<TableItem[]> = new BehaviorSubject<TableItem[]>([]);
  data$: Observable<TableItem[]>;
  paginator: MatPaginator | undefined;
  sort: MatSort | undefined;

  constructor() {
    super();
    this.data$ = this.dataSubject.asObservable();
    this.setData([]);
  }

  setData(data: TableItem[] = []) {
    this.data = data;
    this.dataSubject.next(data);
  }

  connect(): Observable<TableItem[]> {
    if (this.paginator && this.sort) {
      return merge(this.data$, this.paginator.page, this.sort.sortChange).pipe(
        map((data) => {
          return this.getPagedData(this.getSortedData([...this.data]));
        }),
      );
    } else {
      throw Error(
        'Please set the paginator and sort on the data source before connecting.',
      );
    }
  }

  disconnect(): void {
    this.dataSubject.unsubscribe();
  }

  private getPagedData(data: TableItem[]): TableItem[] {
    if (this.paginator) {
      const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
      return data.splice(startIndex, this.paginator.pageSize);
    } else {
      return data;
    }
  }

  private getSortedData(data: TableItem[]): TableItem[] {
    if (!this.sort || !this.sort.active || this.sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      if (!this.sort) {
        return 0;
      }
      const isAsc = this.sort.direction === 'asc';
      const column: string = this.sort.active;
      return alphanumericSort(a[column], b[column], isAsc);
    });
  }
}
