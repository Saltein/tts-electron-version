export function getYoutubeVideoId(input) {
    if (!input || typeof input !== "string") return null;

    input = input.trim();

    // 🔥 убираем всё лишнее (переносы, пробелы внутри)
    input = input.replace(/\s/g, '');

    // если это уже ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
        return input;
    }

    try {
        const url = new URL(
            input.startsWith("http") ? input : "https://" + input
        );

        // watch?v=ID
        const vParam = url.searchParams.get("v");
        if (vParam) return vParam;

        const parts = url.pathname.split("/").filter(Boolean);

        if (url.hostname.includes("youtu.be")) {
            return parts[0] || null;
        }

        if (parts[0] === "live") {
            return parts[1] || null;
        }

        if (parts[0] === "embed") {
            return parts[1] || null;
        }

        if (parts[0] === "video") {
            return parts[1] || null;
        }

        return null;
    } catch {
        return null;
    }
}