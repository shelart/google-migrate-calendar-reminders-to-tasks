/**
 * Ideas are shamelessly taken from https://github.com/Jinjinov/google-reminders-js/blob/e52bc3680dceab01e5506c784da91a5a54950ae9/reminders.js
 */

import loadAuthToken from '../auth/load-auth-token';
import axios from 'axios';
import {GoogleProtobufRemindersList} from './_google-protobuf-reminders-list-type';
import {Reminder} from './reminder-type';
import {Token} from '../auth/token-type';

const loadRemindersCreatedBefore = async function(authToken: Token, createdBefore: Date): Promise<Reminder[]> {
    let responseBody, httpStatus;
    try {
        const {data, status} = await axios.post<GoogleProtobufRemindersList>(
            'https://reminders-pa.clients6.google.com/v1internalOP/reminders/list',
            JSON.stringify({
                '5': 1,
                '6': 9999,
                '16': createdBefore.getTime() + 15 * 3600 * 1000,
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

export default async function(from: Date, till: Date, stepMillis: number): Promise<Reminder[]> {
    const authToken = await loadAuthToken();
    let result: { [id: string] : Reminder } = {};
    for (
        let loadBefore = from;
        loadBefore.getTime() <= till.getTime();
        loadBefore = new Date(loadBefore.getTime() + stepMillis)
    ) {
        console.log(`Loading reminders created before ${loadBefore}...`);
        const remindersPage = await loadRemindersCreatedBefore(authToken, loadBefore);
        const oldCount = Object.entries(result).length;
        for (const reminder of remindersPage) {
            result[reminder.id] = reminder;
        }
        const newCount = Object.entries(result).length;
        console.log(`Loaded ${remindersPage.length} reminders (only ${newCount - oldCount} were not loaded before).`);
    }
    return Object.values(result);
}