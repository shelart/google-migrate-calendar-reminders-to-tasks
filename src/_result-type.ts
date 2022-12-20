import {Reminder} from './calendar/reminder-type';
import {TasksList} from './tasks/tasks-list-type';
import {Task} from './tasks/task-type';
import {Transformation} from './_prepared-type';

export enum ReminderStatus {
    DELETED = 'DELETED',
    FAILED_TO_DELETE = 'FAILED_TO_DELETE',
}

export enum TaskStatus {
    CREATED = 'CREATED',
    FAILED_TO_CREATE = 'FAILED_TO_CREATE',
    DUPLICATE = 'DUPLICATE',
}

export class TransformationStatus {
    public readonly reminder: {
        original: Reminder;
        status: ReminderStatus | null;
    };
    public readonly task: {
        tasksList: TasksList;
        preparedTask: Task;
        createdTask: Task | null;
        status: TaskStatus | null;
    };

    constructor(transformation: Transformation) {
        this.reminder = {
            original: transformation.reminder,
            status: null,
        };
        this.task = {
            preparedTask: transformation.task,
            createdTask: null,
            tasksList: transformation.tasksList!,
            status: null,
        };
    }
}

export type Result = {
    normal: TransformationStatus[];
    recurring: [];
}
