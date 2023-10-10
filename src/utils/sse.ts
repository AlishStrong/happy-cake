import { SseHeaders } from '../models/models';

const headers: SseHeaders = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-control': 'no-cache'
};

const toSseData = (messageObj: object): string => {
    return `data: ${JSON.stringify(messageObj)}\n\n`;
};

export default {
    headers,
    toSseData
};
