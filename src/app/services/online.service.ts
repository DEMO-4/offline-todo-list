import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OnlineService {
  isOnline$ = new BehaviorSubject<boolean>(window.navigator.onLine);

  constructor() {
    this.listenToOnlineStatus();
  }

  listenToOnlineStatus(): void {
    window.addEventListener('online', () => this.isOnline$.next(true));
    window.addEventListener('offline', () => this.isOnline$.next(false));
  }
}
