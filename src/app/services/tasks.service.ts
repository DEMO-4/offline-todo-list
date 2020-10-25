import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {concat, forkJoin, Observable} from 'rxjs';

import {Task, TaskDB} from '../models/task.model';
import {environment} from '../../environments/environment';
import {NgxIndexedDBService} from 'ngx-indexed-db';
import {map, switchMap} from 'rxjs/operators';
import {OnlineService} from './online.service';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private apiPath = `${environment.endpoint}/tasks`;
  private headers = { 'Content-Type': 'application/json' };

  constructor(public http: HttpClient,
              private onlineService: OnlineService,
              private dbService: NgxIndexedDBService) {
    this.syncListener();
  }

  syncListener(): void {
    this.onlineService.isOnline$.subscribe((isOnline) => {
      if (isOnline) {
        // upload all new entries
        // delete all local data
        // refresh local data
        concat(
          this.uploadTasks(),
          this.deleteAllTasks(),
          this.downloadTasks()
          ).subscribe(() => {
        });
      }
    });
  }

  deleteAllTasks(): Observable<boolean> {
    return this.dbService.clear('tasks');
  }

  uploadTasks(): Observable<Task[]> {
    return this.dbService.getAll('tasks')
      .pipe(
        switchMap((tasks: TaskDB[]) => {
          const filteredTasks = tasks.filter(task => !task.isOnServer);
          const apiRequests$ = filteredTasks.map(task => this.createTask(task));
          return forkJoin(apiRequests$);
        })
      );
  }

  downloadTasks(): Observable<number[]> {
    return this.getTasks().pipe(
      switchMap((tasks) => {
        const indexDBOperations = tasks.map((task) => this.dbService.add('tasks', {
            name: task.name,
            isComplete: task.isComplete,
            isOnServer: true
          }));

        return forkJoin(indexDBOperations);
        }
      )
    );
  }

  // use store when offline, and use API when online
  getTasks(): Observable<Task[]> {
    return this.onlineService.isOnline$.pipe(
      switchMap(isOnline => {
        if (isOnline) {
          return this.http.get<Task[]>(this.apiPath);
        } else {
          return this.dbService.getAll('tasks');
        }
      })
    );
  }

  // store data in db
  // use store when offline, and use API when online
  // use isOnServer to tag local vs remote data for upload
  createTask(task: Task): Observable<Task> {
    return this.onlineService.isOnline$.pipe(
      switchMap((isOnline) => {
        return this.dbService.add('tasks', {
          name: task.name,
          isComplete: task.isComplete,
          isOnServer: isOnline
        }).pipe(map((id) => [isOnline, id]));
      }),
      switchMap(([isOnline, id]: [boolean, number]) => {
        if (isOnline) {
          const uri = this.apiPath;
          return this.http.post<Task>(uri, task, {headers: this.headers});
        } else {
          return switchMap(() => this.dbService.getByID('tasks', id));
        }
      })
    );
  }

  private updateTask(task: Task): Observable<Task> {
    const uri = `${this.apiPath}/${task.id}`;

    return this.http.put<Task>(uri, task, {headers: this.headers});
  }

  toggleTask(task: Task): Observable<any> {
    const uri = `${this.apiPath}/${task.id}`;
    const body = { isComplete: task.isComplete };

    return concat(
      this.http.patch<Task>(uri, body, {headers: this.headers}),
      this.deleteAllTasks(),
      this.downloadTasks()
    );
  }

  deleteTask(id: number): Observable<any> {
    const uri = `${this.apiPath}/${id}`;

    return concat(
      this.http.delete(uri),
      this.deleteAllTasks(),
      this.downloadTasks()
    );
  }
}
