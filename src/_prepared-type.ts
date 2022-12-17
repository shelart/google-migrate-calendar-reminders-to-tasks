import {Reminder} from './calendar/reminder-type';
import {TasksList} from './tasks/tasks-list-type';

type Transformation = {
    reminder: Reminder;
    tasksList: TasksList | null;
}

export type Prepared = {
    tasksLists: TasksList[];
    normal: Transformation[];
    recurring: { [mainEventId: string]: Reminder[] };
}
