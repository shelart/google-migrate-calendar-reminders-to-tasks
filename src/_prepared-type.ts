import {Reminder} from './calendar/reminder-type';
import {TasksList} from './tasks/tasks-list-type';
import {Task} from './tasks/task-type';

export type Transformation = {
    reminder: Reminder;
    tasksList: TasksList | null;
    task: Task;
}

export type Prepared = {
    normal: Transformation[];
    recurring: { [mainEventId: string]: Reminder[] };
}
