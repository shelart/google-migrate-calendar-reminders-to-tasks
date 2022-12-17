import {Reminder} from './calendar/reminder-type';

export type Prepared = {
    normal: Reminder[];
    recurring: { [mainEventId: string]: Reminder[] };
}
