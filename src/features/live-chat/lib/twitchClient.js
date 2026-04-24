// twitchClient.js
import tmi from "tmi.js";

export function connectTwitchChat({ token, botNick, channel }) {
    console.warn("connectTwitchChat channel", channel);

    if (!token || !botNick || !channel) {
        console.error("Нет данных для подключения к Twitch");
        return null;
    }

    const client = new tmi.Client({
        options: { debug: false },
        identity: {
            username: botNick,
            password: token.startsWith("oauth:") ? token : `oauth:${token}`,
        },
        channels: [channel?.chatChannelName || channel],
    });

    client.connect();

    client.on("connected", () => {
        console.log(`✅ Подключено к чату Twitch (#${channel})`);
    });

    client.on("disconnected", (reason) => {
        console.warn(`⚠️ Отключено от Twitch: ${reason}`);
    });

    client.on("connecting", () => {
        console.log("🔄 Подключение к Twitch...");
    });

    client.on("logon", () => {
        console.log("🔐 Логин успешен");
    });

    client.on("error", (err) => {
        console.error("❌ Twitch error:", err);
    });

    return client;
}
