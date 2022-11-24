import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import authenticate from './auth/request-token';
import getEvents from './calendar/get-events';
import fs from 'fs';

const args = yargs(hideBin(process.argv))
    .command('auth', 'Perform OAuth 2.0 flow and store the token for this application.', authenticate)
    .command('prepare', 'Download reminders from Google Calendar and generate prepared.json file.', async () => {
        const events = await getEvents();
        fs.writeFileSync('prepared.json', JSON.stringify(events, null, 2));
    })
    .help()
    .argv;
