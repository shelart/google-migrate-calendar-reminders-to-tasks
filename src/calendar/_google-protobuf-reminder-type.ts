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
    11?: number; // remind at timestamp (msec)
    8?: number; // done (1 - done, other or absent - not done)
    18: number; // creation timestamp (msec)
}