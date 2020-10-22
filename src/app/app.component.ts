import {Component, OnInit} from '@angular/core';
import { Task } from './models/task.model';
import {Observable} from 'rxjs';
import {TasksService} from './services/tasks.service';
import {switchMap, tap} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent  implements OnInit {
  newTask: Task = { name: null, isComplete: false };

  allTasks$: Observable<Task[]>;

  constructor(public tasksService: TasksService) {}

  ngOnInit(): void {
    this.allTasks$ = this.getTasks$();
  }

  getTasks$(): Observable<Task[]> {
    return this.tasksService.getTasks();
  }

  createTask(): void {
    this.allTasks$ = this.tasksService.createTask(this.newTask).pipe(
      tap(() => this.newTask.name = null),
      switchMap(() => this.getTasks$()),
    );
  }

  toggleTask(task: Task): void {
    const updatedTask: Task = {...task, isComplete: !task.isComplete};
    this.allTasks$ = this.tasksService.toggleTask(updatedTask).pipe(
      switchMap(() => this.getTasks$()),
    );
  }

  deleteTask(id: number): void {
    this.allTasks$ = this.tasksService.deleteTask(id).pipe(
      switchMap(() => this.getTasks$()),
    );
  }

  onFormChange($event: { target: { value: string }}): void {
    this.newTask.name = $event.target.value;
  }
}
