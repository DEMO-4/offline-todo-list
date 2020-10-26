import {Component, OnInit} from '@angular/core';
import { Task } from './models/task.model';
import {Observable} from 'rxjs';
import {TasksService} from './services/tasks.service';
import {switchMap, take, tap} from 'rxjs/operators';
import {OnlineService} from './services/online.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent  implements OnInit {
  newTask: Task = { name: null, isComplete: false };
  isOnline$ = this.onlineService.isOnline$;
  allTasks$: Observable<Task[]>;

  constructor(public tasksService: TasksService, private onlineService: OnlineService) {}

  ngOnInit(): void {
    this.allTasks$ = this.getTasks$();
  }

  getTasks$(): Observable<Task[]> {
    return this.tasksService.getTasks();
  }

  createTask(event): void {
    event.preventDefault();
    this.tasksService.createTask(this.newTask).pipe(
      take(1)
    ).subscribe(() => {
      this.newTask.name = null;
    });
  }

  toggleTask(task: Task): void {
    const updatedTask: Task = {...task, isComplete: !task.isComplete};
    this.tasksService.toggleTask(updatedTask).pipe(take(3)).subscribe();
  }

  deleteTask(id: number): void {
    this.tasksService.deleteTask(id).pipe(take(3)).subscribe();
  }

  onFormChange($event: { target: { value: string }}): void {
    this.newTask.name = $event.target.value;
  }
}
