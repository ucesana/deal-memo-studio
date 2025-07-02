import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DealMemoCreatorStateService {
  private state = new BehaviorSubject<any>(null);

  setState(state: any): void {
    this.state.next(state);
  }

  getState(): Observable<any> {
    return this.state.asObservable();
  }

  clearState(): void {
    this.state.next(null);
  }
}
