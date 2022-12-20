import loadAuthToken from '../auth/load-auth-token';
import axios from 'axios';
import {Task} from './task-type';

export default async function(tasksListID: string, task: Task): Promise<Task> {
    const authToken = await loadAuthToken();

    let responseBody, httpStatus;
    try {
        const {data, status} = await axios.post<Task>(
            'https://tasks.googleapis.com/tasks/v1/lists/' + encodeURIComponent(tasksListID) + '/tasks',
            task,
            {
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
