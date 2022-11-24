import loadAuthToken from '../auth/load-auth-token';
import axios from 'axios';

export default async function(): Promise<object[]> {
    const token = await loadAuthToken();

    let responseBody, httpStatus;
    try {
        const {data, status} = await axios.get<object[]>(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
                headers: {
                    'Authorization': `Bearer ${token.access_token}`,
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
}