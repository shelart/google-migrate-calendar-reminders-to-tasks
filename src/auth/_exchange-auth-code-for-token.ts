import {AppCredentials} from './_app-credentials-type';
import axios from 'axios';
import {Token} from './token-type';
import fs from 'fs';

type TokenResponse = {
    access_token: string;
    expires_in: number;
    id_token?: string;
    refresh_token: string;
    scope: string;
    token_type: string;
};

const fileNameToken = 'user-secret.json';

export default async function (authCode: string, appCredentials: AppCredentials, codeVerifier: string, redirectUri: string) {
    const {data, status} = await axios.post<TokenResponse>(
        'https://oauth2.googleapis.com/token',
        {
            client_id: appCredentials.installed.client_id,
            client_secret: appCredentials.installed.client_secret,
            code: authCode,
            code_verifier: codeVerifier,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
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
        refresh_token: data.refresh_token,
        scopes: data.scope.split(' '),
        expires_at: new Date().getTime() + data.expires_in * 1000,
    };

    fs.writeFileSync(fileNameToken, JSON.stringify(token, null, 2));
    console.warn(`Token has been stored in ${fileNameToken} file in the app root folder.\n`
        + 'Keep an eye on it! Do not disclose its content to anyone!');
}