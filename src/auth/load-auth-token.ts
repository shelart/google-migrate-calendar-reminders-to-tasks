import {google} from 'googleapis';
import fs from 'fs';
import requestToken from './request-token';
import {OAuth2Client} from 'google-auth-library/build/src/auth/oauth2client';

const fileNameToken = 'user-secret.json';

const loadFromFile = function(): OAuth2Client | null {
    try {
        return google.auth.fromJSON(JSON.parse(fs.readFileSync(fileNameToken, {encoding: 'utf8'}))) as OAuth2Client;
    } catch (e) {
        return null;
    }
}

export default async function(): Promise<OAuth2Client> {
    let client = loadFromFile();
    if (client) {
        return client;
    } else {
        return await requestToken();
    }
}