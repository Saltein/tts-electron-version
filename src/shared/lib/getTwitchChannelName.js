export function getTwitchChannelName(input) {
    if (!input || typeof input !== "string") return null;

    input = input.trim();

    // если это не ссылка
    if (!input.includes("twitch.tv")) {
        return input.replace(/^@/, "");
    }

    try {
        const url = new URL(
            input.startsWith("http") ? input : "https://" + input,
        );
        const parts = url.pathname.split("/").filter(Boolean);

        // первый сегмент — это канал
        return parts[0] || null;
    } catch {
        return null;
    }
}
