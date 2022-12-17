import loadAuthToken from '../auth/load-auth-token';
import axios from 'axios';
import {Token} from '../auth/token-type';
import {TasksList} from './tasks-list-type';

type GoogleTasksListsPage = {
    nextPageToken?: string;
    items: TasksList[];
};

const loadTasksLists = async function(authToken: Token, pageToken?: string): Promise<GoogleTasksListsPage> {
    let responseBody, httpStatus;
    try {
        const {data, status} = await axios.get<GoogleTasksListsPage>(
            'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
            {
                params: {
                    maxResults: 100,
                    pageToken,
                },
                headers: {
                    'Authorization': `Bearer ${authToken.access_token}`,
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

export default async function(): Promise<TasksList[]> {
    const authToken = await loadAuthToken();

    let result: TasksList[] = [];
    let nextPageToken: string | undefined;
    let page = 1;
    do {
        console.log(`Loading Tasks Lists (page ${page})...`);
        const googleTasksListsPage = await loadTasksLists(authToken, nextPageToken);
        result.push(...googleTasksListsPage.items);
        nextPageToken = googleTasksListsPage.nextPageToken;
        ++page;
    } while (nextPageToken);

    return result;
}