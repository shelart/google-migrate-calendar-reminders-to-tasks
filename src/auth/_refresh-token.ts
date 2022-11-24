import {AppCredentials} from './_app-credentials-type';
import axios from 'axios';
import {Token} from './token-type';
import fs from 'fs';

type TokenResponse = {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
};

const fileNameToken = 'user-secret.json';

export default async function (refreshToken: string, appCredentials: AppCredentials): Promise<Token> {
    console.log('Refreshing token...');

    const {data, status} = await axios.post<TokenResponse>(
        'https://oauth2.googleapis.com/token',
        {
            client_id: appCredentials.installed.client_id,
            client_secret: appCredentials.installed.client_secret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        }
    );

    if (!(status < 300)) { // for cases when status is NaN
        throw new Error(`Google API returned status ${status} instead of a token`);
    }

    const token: Token = {
        access_token: data.access_token,
        refresh_token: refreshToken,
        scopes: data.scope.split(' '),
        expires_at: new Date().getTime() + data.expires_in * 1000,
    };

    fs.writeFileSync(fileNameToken, JSON.stringify(token, null, 2));
    console.log('Token has been refreshed.');

    return token;
}