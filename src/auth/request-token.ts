import {AppCredentials} from './_app-credentials-type';
import fs from 'fs';
import {authenticate} from '@google-cloud/local-auth';
import {OAuth2Client} from 'google-auth-library/build/src/auth/oauth2client';
import path from 'path';

const appCredentialsFilePath = 'app-secret.json';
const userTokenFilePath = 'user-secret.json';

export default async function (): Promise<OAuth2Client> {
    const appCredentialsFilePathFullyQualified = path.resolve(appCredentialsFilePath);
    const client = await authenticate({
        scopes: [
            'https://www.googleapis.com/auth/reminders',
            'https://www.googleapis.com/auth/tasks',
        ],
        keyfilePath: appCredentialsFilePathFullyQualified,
    });
    if (client.credentials) {
        const appCredentialsRaw = fs.readFileSync(appCredentialsFilePath, 'utf8');
        const appCredentials = JSON.parse(appCredentialsRaw) as AppCredentials;
        const token = {
            type: 'authorized_user',
            client_id: appCredentials.installed.client_id,
            client_secret: appCredentials.installed.client_secret,
            refresh_token: client.credentials.refresh_token,
        };
        fs.writeFileSync(userTokenFilePath, JSON.stringify(token, null, 2));
        console.warn(`Token has been stored in ${userTokenFilePath} file in the app root folder.\n`
            + 'Keep an eye on it! Do not disclose its content to anyone!');
    }
    return client;
}
