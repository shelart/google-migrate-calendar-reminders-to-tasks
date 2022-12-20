/**
 * Ideas are shamelessly taken from https://github.com/Jinjinov/google-reminders-js/blob/e52bc3680dceab01e5506c784da91a5a54950ae9/reminders.js
 */

import loadAuthToken from '../auth/load-auth-token';
import axios from 'axios';
import {Reminder} from './reminder-type';

export default async function(reminder: Reminder): Promise<void> {
    const authToken = await loadAuthToken();

    let responseBody, httpStatus;
    try {
        const {data, status} = await axios.post<any>(
            'https://reminders-pa.clients6.google.com/v1internalOP/reminders/delete',
            JSON.stringify({
                '2': [
                    {
                        '2': reminder.id,
                    },
                ],
            }),
            {
                params: {
                    access_token: authToken.access_token,
                },
                headers: {
                    'Authorization': `Bearer ${authToken.access_token}`,
                    'Content-Type': 'application/json+protobuf',
                },
            }
        );
        httpStatus = status;
        responseBody = data;
    } catch (e: any) {
        httpStatus = e.response.status;
        responseBody = e.response.data;
    }

    if (!(httpStatus < 300)) { // for cases when status is NaN
        throw new Error(`Google API returned ${httpStatus}: ${JSON.stringify(responseBody, null, 2)}`);
    }
}