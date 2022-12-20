import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import authenticate from './auth/request-token';
import getReminders from './calendar/get-reminders';
import fs from 'fs';
import {Prepared} from './_prepared-type';
import getTasksLists from './tasks/get-tasks-lists';
import {TasksList} from './tasks/tasks-list-type';
import {Task} from './tasks/task-type';
import getTasks from './tasks/get-tasks';
import {ReminderStatus, Result, TaskStatus, TransformationStatus} from './_result-type';
import createTask from './tasks/create-task';
import deleteReminder from './calendar/delete-reminder';

const args = yargs(hideBin(process.argv))
    .command('auth', 'Perform OAuth 2.0 flow and store the token for this application.', authenticate)
    .command('prepare', 'Download reminders from Google Calendar and generate prepared.json file.',
        yargs => {
            const tillDefault = new Date(new Date().getTime() + 365 * 24 * 3600 * 1000); // 1 year after now
            const tillDefaultStr = `${tillDefault.getFullYear()}-${tillDefault.getMonth() + 1}-${tillDefault.getDate()}`;

            return yargs.options({
                'from': {
                    type: 'string',
                    default: '2010-01-01',
                    description: 'Starting date for a loop, within which Google API would be requested to return all reminders created before an iterated date.'
                        + ' Must be in format: YYYY-MM-DD.',
                },
                'till': {
                    type: 'string',
                    default: tillDefaultStr,
                    description: 'Ending date for a loop, within which Google API would be requested to return all reminders created before an iterated date.'
                        + ' Must be in format: YYYY-MM-DD.',
                },
                'step': {
                    type: 'number',
                    default: 30,
                    description: 'Step (in days) for a loop, within which Google API would be requested to return all reminders created before an iterated date.',
                },
            });
        },
        async (argv) => {
            const parseDate = (dateStr: string) => {
                const dateComponents = dateStr.split('-');
                const year = parseInt(dateComponents[0], 10);
                const month = parseInt(dateComponents[1], 10);
                const dayOfMonth = parseInt(dateComponents[2], 10);
                return new Date(year, month - 1, dayOfMonth);
            };

            const reminders = await getReminders(
                parseDate(argv.from),
                parseDate(argv.till),
                argv.step * 24 * 3600 * 1000
            );

            const tasksLists = await getTasksLists();
            const tasksListsMap: { [id: string] : TasksList } = {};
            for (const tasksList of tasksLists) {
                tasksListsMap[tasksList.id] = tasksList;
            }

            console.log(`Preparing ${reminders.length} reminders...`);
            // Segregate recurring & normal reminders.
            const preparedReminders: Prepared = {
                normal: [],
                recurring: {},
            };
            for (const reminder of reminders) {
                if (!reminder.recurring) {
                    preparedReminders.normal.push({
                        reminder,
                        tasksList: null,
                        task: new Task(reminder),
                    });
                } else {
                    if (!preparedReminders.recurring[reminder.recurring.mainEventId]) {
                        preparedReminders.recurring[reminder.recurring.mainEventId] = [];
                    }
                    preparedReminders.recurring[reminder.recurring.mainEventId].push(reminder);
                }
            }
            const numRecurringEvents = Object.entries(preparedReminders.recurring).length;
            if (numRecurringEvents) {
                console.warn(`Found ${numRecurringEvents} recurring reminders which migration is not supported yet!`);
            }

            console.log(`Sorting ${preparedReminders.normal.length} normal reminders...`);
            preparedReminders.normal.sort((r1, r2) =>
                r1.reminder.remindAt.getTime() - r2.reminder.remindAt.getTime());

            fs.writeFileSync('prepared.json', JSON.stringify(preparedReminders, null, 2));
        })
    .command('tasks-lists', 'Download Google Tasks Lists and print them to stdout.',
        yargs => {},
        async (argv) => {
            console.log(await getTasksLists());
        })
    .command('migrate', 'Migrate reminders to Google Tasks in accordance to postpared.json file.',
        yargs => {
            return yargs.options({
                'ignore-tasks-list-title': {
                    type: 'boolean',
                    description: 'By default, for every Tasks List ID specified in postpared.json, the command retrieves its title via Google Tasks API,'
                        + ' then verifies it against the title specified in postpared.json itself, and refuses to work if mismatches.'
                        + '\nIf this flag presents, the command will ignore Tasks Lists titles at all.',
                },
                'ignore-duplicates': {
                    type: 'boolean',
                    description: 'By default, the command verifies title & date/time of the reminder against every task in the list.'
                        + '\nIf this flag presents, the command will not do it, and will simply create a relevant task for each reminder.',
                },
                'delete-reminders': {
                    type: 'boolean',
                    description: 'If presents, the command will delete the reminder after successful creation of a relevant task'
                        + ' OR even not creating the relevant task if a duplicate found (unless --ignore-duplicates set).',
                },
            });
        },
        async (argv) => {
            const postpared = JSON.parse(fs.readFileSync('postpared.json', {encoding: 'utf8'})) as Prepared;

            for (const transformation of postpared.normal) {
                if (!transformation.tasksList) {
                    throw new Error(`Found unmatched Tasks List for transformation: ${JSON.stringify(transformation, null, 2)}.`
                        + `\nEither delete this transformation from postpared.json file, or match a Tasks List to it.`);
                }
            }

            let postparedTasksListsMap: { [id: string] : TasksList } | undefined;
            if (!argv['ignore-tasks-list-title'] || !argv['ignore-duplicates']) {
                // We need to process postpared tasks lists first.
                postparedTasksListsMap = {};
                for (const transformation of postpared.normal) {
                    const tasksList = transformation.tasksList;
                    if (tasksList) {
                        if (!postparedTasksListsMap[tasksList.id]) {
                            postparedTasksListsMap[tasksList.id] = tasksList;
                        }

                        if (postparedTasksListsMap[tasksList.id].title !== tasksList.title) {
                            throw new Error(`Mismatching Tasks List Title in transformation: ${JSON.stringify(transformation, null, 2)},`
                                + ` expected: ${postparedTasksListsMap[tasksList.id].title}, actual: ${tasksList.title}`);
                        }
                    }
                }

            }

            if (!argv['ignore-tasks-list-title']) {
                // Verify that all titles of tasks lists in postpared.json match across the file.
                // Verify that postpared titles match the actual ones.
                const actualTasksLists = await getTasksLists();
                const actualTasksListsMap: { [id: string] : TasksList } = {};
                for (const actualTasksList of actualTasksLists) {
                    actualTasksListsMap[actualTasksList.id] = actualTasksList;
                }
                for (const postparedTasksListID in postparedTasksListsMap) {
                    if (postparedTasksListsMap[postparedTasksListID].title !== actualTasksListsMap[postparedTasksListID].title) {
                        throw new Error(`Mismatching Tasks List Title:`
                            + ` in postpared.json: ${postparedTasksListsMap[postparedTasksListID].title},`
                            + ` returned from API: ${actualTasksListsMap[postparedTasksListID].title}`);
                    }
                }
            }

            const result: Result = {
                normal: [],
                recurring: [],
            };

            if (!argv['ignore-duplicates']) {
                // For every relevant Task List, load all Tasks on it in order to compare to those which are in postpared.json
                const hashTask = (task: Task) => (task.due?.substring(0, 10) ?? '') + '_' + task.title;

                const actualTasks: { [tasksListID: string] : Set<string> } = {};
                for (const postparedTasksListID in postparedTasksListsMap) {
                    actualTasks[postparedTasksListID] = new Set<string>(
                        (await getTasks(postparedTasksListsMap[postparedTasksListID]))
                            .map(hashTask)
                    );
                }

                for (const transformation of postpared.normal) {
                    const transformedTask = transformation.task;
                    const transformedTaskHash = hashTask(transformedTask);
                    const resultRecord = new TransformationStatus(transformation);
                    if (actualTasks[transformation.tasksList!.id].has(transformedTaskHash)) {
                        resultRecord.task.status = TaskStatus.DUPLICATE;
                    }
                    result.normal.push(resultRecord);
                }
            } else {
                for (const transformation of postpared.normal) {
                    const resultRecord = new TransformationStatus(transformation);
                    result.normal.push(resultRecord);
                }
            }

            // Create tasks.
            for (let i = 1; i <= result.normal.length; ++i) {
                const transformation = result.normal[i - 1];

                if (transformation.task.status) {
                    console.log(`[${i} / ${result.normal.length}] Skipping Task "${transformation.task.preparedTask.title}"`
                        + ` (duplicate on the Tasks List "${transformation.task.tasksList.title}")`);
                    continue;
                }

                // Create the task.
                try {
                    console.log(`[${i} / ${result.normal.length}] Creating Task "${transformation.task.preparedTask.title}"`
                        + ` on the Tasks List "${transformation.task.tasksList.title}"...`);
                    transformation.task.createdTask = await createTask(transformation.task.tasksList.id, transformation.task.preparedTask);
                    transformation.task.status = TaskStatus.CREATED;
                } catch (e) {
                    console.error(`Could not create Task: `, e);
                    transformation.task.status = TaskStatus.FAILED_TO_CREATE;
                }
            }

            // Delete reminders (if requested).
            if (argv['delete-reminders']) {
                for (let i = 1; i <= result.normal.length; ++i) {
                    const transformation = result.normal[i - 1];

                    // Verify clearance.
                    if (!(
                        (transformation.task.status === TaskStatus.CREATED)
                        || (transformation.task.status === TaskStatus.DUPLICATE)
                    )) {
                        console.log(`[${i} / ${result.normal.length}] Skipping Reminder "${transformation.reminder.original.title}"`
                            + '(not cleared after creation the Task - probably creation of the relevant Task has failed)');
                        continue;
                    }

                    // Delete the reminder.
                    try {
                        console.log(`[${i} / ${result.normal.length}] Deleting Reminder "${transformation.reminder.original.title}"...`);
                        await deleteReminder(transformation.reminder.original);
                        transformation.reminder.status = ReminderStatus.DELETED;
                    } catch (e) {
                        console.error(`Could not delete Reminder: `, e);
                        transformation.reminder.status = ReminderStatus.FAILED_TO_DELETE;
                    }
                }
            }

            fs.writeFileSync('result.json', JSON.stringify(result, null, 2));
        })
    .help()
    .argv;
