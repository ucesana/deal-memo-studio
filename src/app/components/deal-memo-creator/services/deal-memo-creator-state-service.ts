import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DealMemoCreatorStateService {
  private readonly state = new BehaviorSubject<unknown>(null);
  private readonly isCreatingSubject = new BehaviorSubject<boolean>(false);

  readonly isCreating$: Observable<boolean> =
    this.isCreatingSubject.asObservable();

  setCreating(isCreating: boolean): void {
    this.isCreatingSubject.next(isCreating);
  }

  getIsCreating(): boolean {
    return this.isCreatingSubject.getValue();
  }

  setState(state: unknown): void {
    this.state.next(state);
  }

  getState(): Observable<unknown> {
    return this.state.asObservable();
  }

  clearState(): void {
    this.state.next(null);
    this.setCreating(false);
  }
}
