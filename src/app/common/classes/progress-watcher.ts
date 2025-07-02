import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface Progress<T> {
  status: 'initialised' | 'pending' | 'progress' | 'done';
  step: number;
  progress: number;
  message?: string;
  error?: any;
  result?: T;
}

export class ProgressWatcher<T> {
  private readonly _subject: Subject<Progress<T>> = new BehaviorSubject<
    Progress<T>
  >({
    status: 'initialised',
    step: 0,
    progress: 0,
  });

  private _steps: number;
  private _currentSteps: number;

  constructor(steps: number = 0) {
    this._steps = steps;
    this._currentSteps = 0;
  }

  public destroy(): void {
    this._subject.unsubscribe();
  }

  public getProgress$(): Observable<Progress<T>> {
    return this._subject.asObservable();
  }

  public reset() {
    this._steps = 0;
    this._currentSteps = 0;
    this.nextProgress({
      status: 'initialised',
      step: 0,
      progress: 0,
    });
  }

  public pending(steps?: number) {
    this._steps = steps ?? this._steps;
    this._currentSteps = 0;
    this.nextProgress({
      status: 'pending',
      step: this._currentSteps,
      progress: 0,
    });
  }

  public success(message?: string, result?: T): void {
    if (this._currentSteps < this._steps) {
      this._currentSteps++;
      this.nextProgress({
        status: 'progress',
        step: this._currentSteps,
        progress: this.progress(),
        message,
        result,
      });
    }
  }

  public error(error?: any, result?: T): void {
    if (this._currentSteps < this._steps) {
      this._currentSteps++;
      this.nextProgress({
        status: 'progress',
        step: this._currentSteps,
        progress: this.progress(),
        error,
        result,
      });
    }
  }

  public done() {
    this._currentSteps = this._steps;
    this.nextProgress({
      status: 'done',
      step: this._currentSteps,
      progress: 100,
      message: 'Done',
    });
  }

  public progress: () => number = () => {
    return Math.min(Math.round((this._currentSteps / this._steps) * 100), 100);
  };

  private nextProgress(progress: Progress<T>): void {
    if (this._subject.closed) {
      console.error(
        'ProgressWatcher has been destroyed and is no longer usable',
      );
    } else {
      this._subject.next(progress);
    }
  }
}
