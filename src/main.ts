import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import auth from './auth/request';

const args = yargs(hideBin(process.argv))
    .command('auth', 'Perform OAuth 2.0 flow and store the token for this application.', auth)
    .help()
    .argv;
