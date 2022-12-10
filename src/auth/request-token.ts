import {AppCredentials} from './_app-credentials-type';
import fs from 'fs';
import generateCodeChallenge from './_generate-code-challenge';
import http from 'http';
import {AddressInfo} from 'net';
import exchangeAuthCodeForToken from './_exchange-auth-code-for-token';

// Returns the port number.
const startAuthResponseListener = function (responseResolve: Function, appCredentials: AppCredentials, codeVerifier: string)
    : Promise<number>
{
    let port: number;

    const server = http.createServer(async (req, res) => {
        if (req.url!.startsWith('/favicon.')) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('No favicon provided for this mini server.');
            return;
        }

        try {
            if (!req.url!.startsWith('/?')) {
                throw new Error(`Unknown URL requested: ${req.url}`);
            }

            let params: {[id: string]: string} = {};
            for (const urlComponent of req.url!.substring(2).split('&')) {
                const entry = urlComponent.split('=');
                if (entry.length !== 2) {
                    throw new Error(`Could not parse a parameter: ${entry}`);
                }
                params[entry[0]] = entry[1];
            }

            if (!params.code) {
                throw new Error(`No Auth Code found`);
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Thank you for authorizing the app. You can close this page now, and return to the console application.');

            setTimeout(() => {
                console.log('Shutting down the authorization listener...');
                server.close(() => {
                    console.log('Authorization listener is shut down.')
                });
            }, 0);

            console.log('Exchanging Auth Code for Token...');
            await exchangeAuthCodeForToken(params.code, appCredentials, codeVerifier, `http://127.0.0.1:${port}`);

            responseResolve();
        } catch (e) {
            console.warn(e);
            res.statusCode = 404;
            res.end('Unexpected error occurred.');
        }
    });

    return new Promise(resolve => {
        server.on('listening', () => {
            port = (server.address()! as AddressInfo).port;
            console.log(`Listening for the authorization response on port ${port}...`);
            resolve(port);
        });
        server.listen();
    });
};

export default async function (): Promise<void> {
    const appCredentialsRaw = fs.readFileSync('app-secret.json', 'utf8');
    const appCredentials = JSON.parse(appCredentialsRaw) as AppCredentials;

    const {codeVerifier, codeChallenge} = generateCodeChallenge();

    return new Promise(async resolve => {
        const listenPort = await startAuthResponseListener(resolve, appCredentials, codeVerifier);
        const reqParams = {
            client_id: appCredentials.installed.client_id,
            redirect_uri: `http://127.0.0.1:${listenPort}`,
            response_type: 'code',
            scope: [
                'https://www.googleapis.com/auth/reminders',
                'https://www.googleapis.com/auth/tasks',
            ].join(' '),
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        };
        const reqUrl = 'https://accounts.google.com/o/oauth2/v2/auth?'
            + Object.entries(reqParams)
                .map(e => e[0] + '=' + encodeURIComponent(e[1]))
                .join('&');

        console.log(`Please visit URL:\n\n${reqUrl}\n`);
        console.log('Waiting for your authorization...');
    });
}
