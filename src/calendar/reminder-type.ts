import {GoogleProtobufReminder} from './_google-protobuf-reminder-type';

export enum RecurringUnit {
    DAYS = "DAYS",
    WEEKS = "WEEKS",
    MONTHS = "MONTHS",
    YEARS = "YEARS",
}

export enum RecurringEnding {
    DATE = "DATE",
    OCCURRENCES = "OCCURRENCES",
}

class Weekly {
    public readonly dayOfWeek: number;
    constructor(protobuf: NonNullable<NonNullable<GoogleProtobufReminder['16']>['1']['6']>) {
        this.dayOfWeek = protobuf['1'][0];
    }
}

export enum MonthlyRecurrenceType {
    ON_DAY_OF_MONTH = "ON_DAY_OF_MONTH",
    ON_DAY_OF_WEEK_CERTAIN = "ON_DAY_OF_WEEK_CERTAIN",
    ON_DAY_OF_WEEK_LAST_IN_MONTH = "ON_DAY_OF_WEEK_LAST_IN_MONTH",
}

class Monthly {
    public readonly type: MonthlyRecurrenceType;
    public readonly dayOfMonth: number | null;
    public readonly dayOfWeek: number | null;
    public readonly dayOfWeekSeqNo: number | null;
    constructor(protobuf: NonNullable<NonNullable<GoogleProtobufReminder['16']>['1']['7']>) {
        if (protobuf['1']) {
            this.type = MonthlyRecurrenceType.ON_DAY_OF_MONTH;
            this.dayOfMonth = protobuf['1'][0];
            this.dayOfWeek = null;
            this.dayOfWeekSeqNo = null;
        } else if (protobuf['3'] && protobuf['4']) {
            this.dayOfWeek = protobuf['3'];
            if (protobuf['4'] === -1) {
                this.type = MonthlyRecurrenceType.ON_DAY_OF_WEEK_LAST_IN_MONTH;
                this.dayOfWeekSeqNo = null;
                this.dayOfMonth = null;
            } else {
                this.type = MonthlyRecurrenceType.ON_DAY_OF_WEEK_CERTAIN;
                this.dayOfWeekSeqNo = protobuf['4'];
                this.dayOfMonth = null;
            }
        } else {
            throw new Error('Unrecognized monthly recurrence!');
        }
    }
}

class Yearly {
    public readonly dayOfMonth: number;
    public readonly month: number;
    constructor(protobuf: NonNullable<NonNullable<GoogleProtobufReminder['16']>['1']['8']>) {
        this.dayOfMonth = protobuf['1']['1'][0];
        this.month      = protobuf['2'][0];
    }
}

class Recurring {
    public readonly mainEventId: string;
    public readonly unit: RecurringUnit;
    public readonly interval: number;
    public readonly ending: {
        type: RecurringEnding;
        value: Date | number;
    } | null;
    public readonly repeatOn: Weekly | Monthly | Yearly | null;

    constructor(protobuf: NonNullable<GoogleProtobufReminder['16']>) {
        switch (protobuf['1']['1']) {
            case 0: {
                this.unit = RecurringUnit.DAYS;
                break;
            }
            case 1: {
                this.unit = RecurringUnit.WEEKS;
                break;
            }
            case 2: {
                this.unit = RecurringUnit.MONTHS;
                break;
            }
            case 3: {
                this.unit = RecurringUnit.YEARS;
                break;
            }
            default:
                throw new Error('Unexpected recurring unit!');
        }
        this.interval = protobuf['1']['2'];
        if (protobuf['1']['4']) {
            if (protobuf['1']['4']['1']) {
                this.ending = {
                    type: RecurringEnding.DATE,
                    value: new Date(
                        protobuf['1']['4']['1']['1'],
                        protobuf['1']['4']['1']['2'] - 1,
                        protobuf['1']['4']['1']['3'],
                    ),
                };
            } else if (protobuf['1']['4']['3']) {
                this.ending = {
                    type: RecurringEnding.OCCURRENCES,
                    value: protobuf['1']['4']['3'],
                };
            } else {
                throw new Error('Unsupported ending condition on a recurring event!');
            }
        } else {
            this.ending = null;
        }
        switch (this.unit) {
            case RecurringUnit.DAYS: {
                this.repeatOn = null;
                break;
            }
            case RecurringUnit.WEEKS: {
                this.repeatOn = new Weekly(protobuf['1']['6']!);
                break;
            }
            case RecurringUnit.MONTHS: {
                this.repeatOn = new Monthly(protobuf['1']['7']!);
                break;
            }
            case RecurringUnit.YEARS: {
                this.repeatOn = new Yearly(protobuf['1']['8']!);
                break;
            }
            default:
                throw new Error('Unexpected recurring unit!');
        }
        this.mainEventId = protobuf['2']['1'];
    }
}

export class Reminder {
    public readonly id: string;
    public readonly title: string;
    public readonly createdAt: Date;
    public readonly remindAt: Date;
    public readonly entireDay: boolean;
    public readonly done: boolean;
    public readonly recurring: Recurring | null;
    //public readonly protobufSource: GoogleProtobufReminder;

    constructor(protobufReminder: GoogleProtobufReminder) {
        //this.protobufSource = protobufReminder;
        try {
            this.id = protobufReminder['1']['2'];
            this.title = protobufReminder['3'];
            this.createdAt = new Date(parseInt(protobufReminder['18'], 10));
            if (protobufReminder['5']) {
                this.remindAt = new Date(
                    protobufReminder['5']['1'],
                    protobufReminder['5']['2'] - 1,
                    protobufReminder['5']['3']
                );
                if (protobufReminder['5']['4']) {
                    this.remindAt.setHours(
                        protobufReminder['5']['4']['1'],
                        protobufReminder['5']['4']['2'],
                        protobufReminder['5']['4']['3']
                    );
                    this.entireDay = false;
                } else {
                    this.entireDay = true;
                }
            } else if (protobufReminder['11']) {
                this.remindAt = new Date(parseInt(protobufReminder['11'], 10));
                this.entireDay = false;
            } else {
                throw new Error('Could not find when to remind!');
            }
            this.done = !!protobufReminder['8'] && (protobufReminder['8'] == 1);
            if (protobufReminder['16']) {
                this.recurring = new Recurring(protobufReminder['16']);
            } else {
                this.recurring = null;
            }
        } catch (e) {
            console.error('Invalid Google Reminder Protobuf:', protobufReminder);
            throw e;
        }
    }
}