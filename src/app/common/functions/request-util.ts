import { HttpStatusCode } from '@angular/common/http';
import {
  defer,
  finalize,
  from,
  MonoTypeOperatorFunction,
  Observable,
  of,
  retry,
} from 'rxjs';
import { catchError, delay, map, mergeMap, tap, toArray } from 'rxjs/operators';
import { ProgressWatcher } from '../classes/progress-watcher';

export interface RequestJob<T> {
  id: string;
  title: string;
  tasks: RequestTask<T>[];
  batchSize: number;
}

export interface RequestJobResult<T> {
  id: string;
  title: string;
  results: RequestResult<T>[];
}

export interface RequestTask<T> {
  id: string;
  title: string;
  request$: Observable<T>;
}

export interface RequestResult<T> {
  id: string;
  title: string;
  success: boolean;
  error?: any;
  result?: T;
}

export const withExponentialBackoff = <T>(
  maxRetries = 5,
  initialDelay = 1000,
  errorStatus: number = HttpStatusCode.TooManyRequests,
): MonoTypeOperatorFunction<T> =>
  retry({
    count: maxRetries,
    delay: (error, retryCount) => {
      if (error.status === errorStatus) {
        return of(null).pipe(delay(initialDelay * Math.pow(2, retryCount - 1)));
      }
      throw error;
    },
  });

export function processRequests<T>(
  requests: RequestTask<T>[],
  batchSize: number = 10,
  errorStatus: number = HttpStatusCode.TooManyRequests,
): Observable<RequestResult<T>[]> {
  return from(requests).pipe(
    mergeMap(
      (item: RequestTask<T>) =>
        item.request$.pipe(
          withExponentialBackoff(5, 1000, errorStatus),
          map((response: T) => ({
            id: item.id,
            title: item.title,
            success: true,
            response,
          })),
          catchError((error) =>
            of({
              id: item.id,
              title: item.title,
              success: false,
              error,
            }),
          ),
        ),
      batchSize,
    ),
    toArray(),
  );
}

export function processRequestsWatchProgress<T>(
  requests: RequestTask<T>[],
  progressWatcher: ProgressWatcher<RequestResult<T>>,
  batchSize: number = 10,
  errorStatus: number = HttpStatusCode.TooManyRequests,
): Observable<RequestResult<T>[]> {
  return from(requests).pipe(
    mergeMap(
      (task: RequestTask<T>) =>
        task.request$.pipe(
          withExponentialBackoff(5, 1000, errorStatus),
          map((response: T) => ({
            id: task.id,
            title: task.title,
            success: true,
            result: response,
          })),
          catchError((error) =>
            of({
              id: task.id,
              title: task.title,
              success: false,
              error,
            }),
          ),
          tap((result: RequestResult<T>) => {
            if (result.success) {
              progressWatcher.success(result.title, result);
            } else {
              progressWatcher.error(result.error, result);
            }
          }),
        ),
      batchSize,
    ),
    toArray(),
  );
}
