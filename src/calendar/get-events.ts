import loadAuthToken from '../auth/load-auth-token';
import axios from 'axios';
import {Events} from './events-list-type';
import {Token} from '../auth/token-type';

const loadEventsPage = async function(authToken: Token, pageToken?: string): Promise<Events> {
    let responseBody, httpStatus;
    try {
        const {data, status} = await axios.get<Events>(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
                params: {
                    pageToken,
                },
                headers: {
                    'Authorization': `Bearer ${authToken.access_token}`,
                    'Content-Type': 'application/json',
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

    return responseBody;
};

export default async function(): Promise<Events> {
    const authToken = await loadAuthToken();

    let nextPageToken: string | undefined;
    let result: Events | undefined;
    let page = 1;
    do {
        console.log(`Loading events (page ${page})...`);
        const eventsPage = await loadEventsPage(authToken, nextPageToken);
        if (!result) {
            result = eventsPage;
        } else {
            result.items.push(...eventsPage.items);
        }

        nextPageToken = eventsPage.nextPageToken;
        ++page;
    } while (nextPageToken);

    return result;
}