import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let widgetServer = null;

const WIDGET_PORT = 3030;

export function startWidgetServer() {
    return new Promise((resolve, reject) => {
        const app = express();
        const DIST_PATH = path.join(__dirname, "../dist");

        // Критически важная строка: ассеты с /widget/ ищутся в dist/assets
        app.use("/widget", express.static(DIST_PATH));
        app.use(express.static(DIST_PATH));

        // SPA fallback: любой GET без расширения → index.html
        app.use((req, res, next) => {
            if (req.method !== "GET") return next();
            if (path.extname(req.path)) return next();
            res.sendFile(path.join(DIST_PATH, "index.html"));
        });

        widgetServer = createServer(app);
        widgetServer.listen(WIDGET_PORT, () => {
            console.log(
                `Widget server running on http://127.0.0.1:${WIDGET_PORT}`,
            );
            resolve(WIDGET_PORT);
        });
        widgetServer.on("error", reject);
    });
}

export function stopWidgetServer() {
    if (widgetServer) {
        widgetServer.close();
        widgetServer = null;
    }
}
