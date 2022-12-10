import {GoogleProtobufReminder} from './_google-protobuf-reminder-type';

export class Reminder {
    public readonly id: string;
    public readonly title: string;
    public readonly createdAt: Date;
    public readonly remindAt: Date;
    public readonly entireDay: boolean;
    public readonly done: boolean;

    constructor(protobufReminder: GoogleProtobufReminder) {
        try {
            this.id = protobufReminder['1']['2'];
            this.title = protobufReminder['3'];
            this.createdAt = new Date(protobufReminder['18']);
            if (protobufReminder['5']) {
                this.remindAt = new Date(
                    protobufReminder['5']['1'],
                    protobufReminder['5']['2'] - 1,
                    protobufReminder['5']['3']
                );
                if (protobufReminder['5']['4']) {
                    this.remindAt.setHours(
                        protobufReminder['5']['4']['1'],
                        protobufReminder['5']['4']['2'],
                        protobufReminder['5']['4']['3']
                    );
                    this.entireDay = false;
                } else {
                    this.entireDay = true;
                }
            } else if (protobufReminder['11']) {
                this.remindAt = new Date(protobufReminder['11']);
                this.entireDay = false;
            } else {
                throw new Error('Could not find when to remind!');
            }
            this.done = !!protobufReminder['8'] && (protobufReminder['8'] == 1);
        } catch (e) {
            console.error('Invalid Google Reminder Protobuf:', protobufReminder);
            throw e;
        }
    }
}