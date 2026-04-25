// twitchClientSingleton.js
import { connectTwitchChat } from './twitchClient'
let client = null;

export function getTwitchClient() {
    return client;
}

export function connectTwitchClient(options, dispatch) {
    if (!client) {
        client = connectTwitchChat(options, dispatch);
    }
    return client;
}

export function disconnectTwitchClient() {
    if (client) {
        client.disconnect();
        client = null;
    }
}