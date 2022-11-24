import {Token} from './token-type';
import fs from 'fs';
import authenticate from './request-token';
import refreshToken from './_refresh-token';
import {AppCredentials} from './_app-credentials-type';

const fileNameToken = 'user-secret.json';

export default async function(): Promise<Token> {
    if (!fs.existsSync(fileNameToken)) {
        await authenticate();
    }

    const token: Token = JSON.parse(fs.readFileSync(fileNameToken, {encoding: 'utf8'}));
    const now = new Date().getTime();
    if (token.expires_at < now) {
        const appCredentialsRaw = fs.readFileSync('app-secret.json', 'utf8');
        const appCredentials = JSON.parse(appCredentialsRaw) as AppCredentials;
        return await refreshToken(token.refresh_token, appCredentials);
    } else {
        return token;
    }
}