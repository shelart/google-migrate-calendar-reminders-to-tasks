import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import authenticate from './auth/request-token';
import getReminders from './calendar/get-reminders';
import fs from 'fs';

const args = yargs(hideBin(process.argv))
    .command('auth', 'Perform OAuth 2.0 flow and store the token for this application.', authenticate)
    .command('prepare', 'Download reminders from Google Calendar and generate prepared.json file.', async () => {
        const reminders = await getReminders(
            new Date(2016, 0, 1),
            new Date(new Date().getTime() + 365 * 24 * 3600 * 1000), // 1 year after now
            30 * 24 * 3600 * 1000 // step 30 days
        );
        console.log(`Preparing ${reminders.length} reminders...`);
        fs.writeFileSync('prepared.json', JSON.stringify(reminders, null, 2));
    })
    .help()
    .argv;
