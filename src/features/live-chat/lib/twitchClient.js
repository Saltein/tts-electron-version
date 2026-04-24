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

    client.connect().catch((err) => {
        console.error("❌ Ошибка подключения к Twitch:", err);
        return;
    });

    client.on("error", (err) => {
        console.error("❌ Twitch error:", err);
    });

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

    let joined = false;

    client.on("join", (ch, username, self) => {
        if (self) {
            joined = true;
            console.log("✅ Успешно подключились к каналу:", ch);
        }
    });

    client.on("notice", (channel, msgid, message) => {
        console.warn("⚠️ NOTICE:", msgid, message);
    });

    return client;
}
