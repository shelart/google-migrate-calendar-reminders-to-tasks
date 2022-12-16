import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import authenticate from './auth/request-token';
import getReminders from './calendar/get-reminders';
import fs from 'fs';
import {Reminder} from './calendar/reminder-type';

const args = yargs(hideBin(process.argv))
    .command('auth', 'Perform OAuth 2.0 flow and store the token for this application.', authenticate)
    .command('prepare', 'Download reminders from Google Calendar and generate prepared.json file.',
        yargs => {
            const tillDefault = new Date(new Date().getTime() + 365 * 24 * 3600 * 1000); // 1 year after now
            const tillDefaultStr = `${tillDefault.getFullYear()}-${tillDefault.getMonth() + 1}-${tillDefault.getDate()}`;

            return yargs.options({
                'from': {
                    type: 'string',
                    default: '2016-01-01',
                    description: 'Starting date for a loop, within which Google API would be requested to return all reminders created before an iterated date.'
                        + ' Must be in format: YYYY-MM-DD.',
                },
                'till': {
                    type: 'string',
                    default: tillDefaultStr,
                    description: 'Ending date for a loop, within which Google API would be requested to return all reminders created before an iterated date.'
                        + ' Must be in format: YYYY-MM-DD.',
                },
                'step': {
                    type: 'number',
                    default: 30,
                    description: 'Step (in days) for a loop, within which Google API would be requested to return all reminders created before an iterated date.',
                },
            });
        },
        async (argv) => {
            const parseDate = (dateStr: string) => {
                const dateComponents = dateStr.split('-');
                const year = parseInt(dateComponents[0], 10);
                const month = parseInt(dateComponents[1], 10);
                const dayOfMonth = parseInt(dateComponents[2], 10);
                return new Date(year, month - 1, dayOfMonth);
            };

            const reminders = await getReminders(
                parseDate(argv.from),
                parseDate(argv.till),
                argv.step * 24 * 3600 * 1000
            );

            console.log(`Sorting ${reminders.length} reminders...`);
            reminders.sort((r1, r2) => r1.remindAt.getTime() - r2.remindAt.getTime());

            console.log(`Preparing ${reminders.length} reminders...`);
            // Segregate recurring & normal reminders.
            const preparedReminders = {
                normal: [] as Reminder[],
                recurring: {} as { [mainEventId: string]: Reminder[] },
            };
            for (const reminder of reminders) {
                if (!reminder.recurring) {
                    preparedReminders.normal.push(reminder);
                } else {
                    if (!preparedReminders.recurring[reminder.recurring.mainEventId]) {
                        preparedReminders.recurring[reminder.recurring.mainEventId] = [];
                    }
                    preparedReminders.recurring[reminder.recurring.mainEventId].push(reminder);
                }
            }
            const numRecurringEvents = Object.entries(preparedReminders.recurring).length;
            if (numRecurringEvents) {
                console.warn(`Found ${numRecurringEvents} recurring reminders which migration is not supported yet!`);
            }
            fs.writeFileSync('prepared.json', JSON.stringify(preparedReminders, null, 2));
        })
    .help()
    .argv;
