export type GoogleProtobufReminder = {
    1: {
        2: string; // id
    };
    3: string; // title
    5?: {
        1: number; // year
        2: number; // month (1-12)
        3: number; // day;
        4?: {
            1: number; // hour
            2: number; // minute
            3: number; // second
        }
    };
    11?: string; // remind at timestamp (msec)
    8?: number; // done (1 - done, other or absent - not done)
    18: string; // creation timestamp (msec)
    16?: { // recurring
        1: {
            1: number; // recurring units: 0 = days, 1 = weeks, 2 = months, 3 = years
            2: number; // recurring interval
            4?: { // end recurring
                1?: { // ending date
                    1: number; // year
                    2: number; // month (1-12)
                    3: number; // day;
                };
                3?: number; // how much times to repeat (same value for all instances, need to count carefully from the first occurrence)
            };
            6?: { // only for recurring by weeks
                1: number[]; // days of week to recur
            };
            7?: { // only for recurring by months
                1?: number[]; // days of month to recur (presumably always single item)
                3?: number; // day of week
                4?: number; // which occurrence of the day of week to remind on (-1 = last)
            };
            8?: { // only for recurring by years
                1: {
                    1: number[]; // days of month to recur (presumably always single item)
                };
                2: number[]; // month to recur (1-12) (presumably always single item)
            };
        };
        2: {
            1: string; // main event id
        }
    };
}