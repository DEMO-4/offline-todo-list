import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { Task } from '../models/task.model';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private apiPath = `${environment.endpoint}/tasks`;
  private headers = { 'Content-Type': 'application/json' };

  constructor(public http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    const uri = this.apiPath;

    return this.http.get<Task[]>(uri);
  }

  createTask(task: Task): Observable<Task> {
    const uri = this.apiPath;

    return this.http.post<Task>(uri, task, {headers: this.headers});
  }

  updateTask(task: Task): Observable<Task> {
    const uri = `${this.apiPath}/${task.id}`;

    return this.http.put<Task>(uri, task, {headers: this.headers});
  }

  toggleTask(task: Task): Observable<Task> {
    const uri = `${this.apiPath}/${task.id}`;
    const body = { isComplete: task.isComplete };

    return this.http.patch<Task>(uri, body, {headers: this.headers});
  }

  deleteTask(id: number): Observable<any> {
    const uri = `${this.apiPath}/${id}`;

    return this.http.delete(uri);
  }
}
