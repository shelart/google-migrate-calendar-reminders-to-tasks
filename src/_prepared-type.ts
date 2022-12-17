import {Reminder} from './calendar/reminder-type';
import {TasksList} from './tasks/tasks-list-type';
import {Task} from './tasks/task-type';

type Transformation = {
    reminder: Reminder;
    tasksList: TasksList | null;
    task: Task;
}

export type Prepared = {
    tasksLists: TasksList[];
    normal: Transformation[];
    recurring: { [mainEventId: string]: Reminder[] };
}