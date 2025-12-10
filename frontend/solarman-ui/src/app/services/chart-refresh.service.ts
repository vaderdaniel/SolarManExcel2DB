import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChartRefreshService {
  private refreshSubject = new Subject<void>();
  
  public refresh$ = this.refreshSubject.asObservable();

  triggerRefresh(): void {
    this.refreshSubject.next();
  }
}
