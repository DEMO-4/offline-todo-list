export interface Task {
  id?: number;
  name: string;
  isComplete: boolean;
}

export interface TaskDB {
  id: number;
  name: string;
  isComplete: boolean;
  isOnServer: boolean;
}
