import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {concat, forkJoin, Observable, of, Subject} from 'rxjs';

import {Task, TaskDB} from '../models/task.model';
import {environment} from '../../environments/environment';
import {NgxIndexedDBService} from 'ngx-indexed-db';
import {concatMap, map, switchMap, tap} from 'rxjs/operators';
import {OnlineService} from './online.service';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private apiPath = `${environment.endpoint}/tasks`;
  private headers = { 'Content-Type': 'application/json' };
  syncPending = false;
  private tasks$ = new Subject<TaskDB[]>();

  constructor(public http: HttpClient,
              private onlineService: OnlineService,
              private dbService: NgxIndexedDBService<TaskDB>) {
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
          this.fetchTasks()
        ).subscribe(() => {
        });
      }
    });
  }

  deleteAllTasks(): Observable<boolean> {
    return this.dbService.clear('tasks');
  }

  private uploadTask(task: Task): Observable<Task> {
    return this.http.post<Task>(this.apiPath, {...task}, {headers: this.headers});
  }

  private uploadTasks(): Observable<Task[]> {
    return this.dbService.getAll('tasks')
      .pipe(
        switchMap((tasks: TaskDB[]) => {
          const filteredTasks = tasks.filter(task => !task.isOnServer);
          const apiRequests: Observable<Task>[] = filteredTasks.map(task => this.uploadTask(task));
          return forkJoin(apiRequests);
        })
      );
  }

  fetchTasks(): Observable<TaskDB[]> {
    return this.http.get<Task[]>(this.apiPath).pipe(
      switchMap((tasks) => {
        const indexDBOperations = tasks.map((task) => this.dbService.add('tasks', {
            id: task.id,
            name: task.name,
            isComplete: task.isComplete,
            isOnServer: true
          }));

        return forkJoin(indexDBOperations);
        }
      ),
      switchMap(() => this.dbService.getAll('tasks')),
      tap((tasks) => {
        debugger;
        this.tasks$.next(tasks);
      })
    );
  }

  // use store when offline, and use API when online
  getTasks(): Observable<TaskDB[]> {
    return this.tasks$.asObservable();
  }

  // store data in db
  // use store when offline, and use API when online
  // use isOnServer to tag local vs remote data for upload
  createTask(task: Task): Observable<any> {
    return this.onlineService.isOnline$.pipe(
      switchMap((isOnline) => {
        const newDbTask = {
          ...task,
          isOnServer: isOnline
        } as TaskDB;

        return this.dbService.add('tasks', newDbTask).pipe(map((id) => [isOnline, id]));
      }),
      switchMap(([isOnline, id]: [boolean, number]) => {
        if (isOnline) {
          return this.uploadTask({...task, id});
        } else {
          return of({});
        }
      }),
      switchMap(() => this.dbService.getAll('tasks')),
      tap((tasks) => this.tasks$.next(tasks))
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
      this.fetchTasks()
    );
  }

  deleteTask(id: number): Observable<any> {
    const uri = `${this.apiPath}/${id}`;

    return concat(
      this.http.delete(uri, {headers: this.headers}),
      this.deleteAllTasks(),
      this.fetchTasks()
    );
  }
}
