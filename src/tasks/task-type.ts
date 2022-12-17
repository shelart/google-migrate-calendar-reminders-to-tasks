import {Reminder} from '../calendar/reminder-type';

enum TaskStatus {
    UNDONE = "needsAction",
    DONE = "completed",
}

export class Task {
    public readonly id?: string;
    public readonly title: string;
    public readonly updated?: string;
    public readonly parent?: string;
    public readonly position?: string;
    public readonly notes?: string;
    public readonly status: TaskStatus;
    public readonly due?: string;
    public readonly completed?: string;
    public readonly deleted?: boolean;
    public readonly hidden?: boolean;

    constructor(reminder: Reminder) {
        this.title = reminder.title;
        this.due = reminder.remindAt.toISOString();
        if (reminder.done) {
            this.status = TaskStatus.DONE;
            this.completed = reminder.remindAt.toISOString();
        } else {
            this.status = TaskStatus.UNDONE;
        }
    }
}
