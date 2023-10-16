import { ClientData } from '../models/models';

/**
 * Because the communication is asynchronous using SSE,
 * the application needs to keep track of clients.
 * Once Cakery API responses, the application will find the right client
 * and forward a message using SSE
 */
const clients: ClientData[] = [];

const getClient = (clientId: string) => {
    const foundClient = clients.find((c) => c.clientId === clientId);
    if (!foundClient) {
        throw new Error(JSON.stringify(['Unknown client request']));
    } else if ('status' in foundClient) {
        if (foundClient.status === 'processed') {
            throw new Error(
                JSON.stringify(['Request is already under processing'])
            );
        } else {
            foundClient.status = 'processed';
            clients.splice(
                clients.findIndex((c) => c.clientId === clientId),
                1,
                foundClient
            );
            return foundClient;
        }
    } else {
        return foundClient;
    }
};

const removeClient = (clientId: string) => {
    const index = clients.findIndex((c) => c.clientId === clientId);
    if (index !== -1) {
        clients.splice(index, 1);
    }
};

export default {
    clients,
    getClient,
    removeClient
};
