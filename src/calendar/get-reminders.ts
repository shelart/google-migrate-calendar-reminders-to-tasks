/**
 * Ideas are shamelessly taken from https://github.com/Jinjinov/google-reminders-js/blob/e52bc3680dceab01e5506c784da91a5a54950ae9/reminders.js
 */

import loadAuthToken from '../auth/load-auth-token';
import axios from 'axios';
import {GoogleProtobufRemindersList} from './_google-protobuf-reminders-list-type';
import {Reminder} from './reminder-type';

export default async function(): Promise<Reminder[]> {
    const authToken = await loadAuthToken();

    let responseBody, httpStatus;
    try {
        const {data, status} = await axios.post<GoogleProtobufRemindersList>(
            'https://reminders-pa.clients6.google.com/v1internalOP/reminders/list',
            JSON.stringify({
                '5': 1,
                '6': 9999,
            }),
            {
                params: {
                    access_token: authToken.access_token,
                },
                headers: {
                    'Authorization': `Bearer ${authToken.access_token}`,
                    'Content-Type': 'application/json+protobuf',
                    'Accept': 'application/json',
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

    const protobufRemindersList = responseBody as GoogleProtobufRemindersList;
    if (!protobufRemindersList['1']) {
        return [];
    } else {
        return protobufRemindersList['1']!.map(protobufReminder => new Reminder(protobufReminder));
    }
}