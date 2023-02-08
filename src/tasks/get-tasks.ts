import loadAuthToken from '../auth/load-auth-token';
import axios from 'axios';
import {Token} from '../auth/token-type';
import {Task} from './task-type';
import {TasksList} from './tasks-list-type';

type GoogleTasksPage = {
    nextPageToken?: string;
    items: Task[];
};

const loadTasks = async function(authToken: string, tasksListID: string, pageToken?: string): Promise<GoogleTasksPage> {
    let responseBody, httpStatus;
    try {
        const {data, status} = await axios.get<GoogleTasksPage>(
            'https://tasks.googleapis.com/tasks/v1/lists/' + encodeURIComponent(tasksListID) + '/tasks',
            {
                params: {
                    maxResults: 100,
                    pageToken,
                    showCompleted: true,
                    showHidden: true,
                },
                headers: {
                    'Authorization': `Bearer ${authToken}`,
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

export default async function(tasksList: TasksList): Promise<Task[]> {
    const client = await loadAuthToken();
    const authToken = (await client.getAccessToken()).token!;

    let result: Task[] = [];
    let nextPageToken: string | undefined;
    let page = 1;
    do {
        console.log(`Loading Tasks on "${tasksList.title}" (page ${page})...`);
        const googleTasksPage = await loadTasks(authToken, tasksList.id, nextPageToken);
        result.push(...googleTasksPage.items);
        nextPageToken = googleTasksPage.nextPageToken;
        ++page;
    } while (nextPageToken);

    return result;
}