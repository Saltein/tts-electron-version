import express from "express";
import { createServer } from "http";

let server = null;
let mainWindow = null;

const OAUTH_PORT = 3456; // Фиксированный порт

export function startOAuthServer(window) {
    mainWindow = window;

    return new Promise((resolve, reject) => {
        const app = express();

        app.get("/oauth2callback", (req, res) => {
            const { code, error } = req.query;

            if (code && mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("google-oauth-code", code);
                res.send(`
                    <html>
                        <body style="font-family: Arial; text-align: center; padding-top: 50px;">
                            <h2>Авторизация успешна!</h2>
                            <p>Можете закрыть это окно и вернуться в приложение.</p>
                            <script>setTimeout(() => window.close(), 2000);</script>
                        </body>
                    </html>
                `);
            } else if (error) {
                res.send(`
                    <html>
                        <body style="font-family: Arial; text-align: center; padding-top: 50px;">
                            <h2>Ошибка авторизации</h2>
                            <p>${error}</p>
                        </body>
                    </html>
                `);
            } else {
                res.send(`
                    <html>
                        <body style="font-family: Arial; text-align: center; padding-top: 50px;">
                            <h2>Нет кода авторизации</h2>
                        </body>
                    </html>
                `);
            }
        });

        server = createServer(app);
        server.listen(OAUTH_PORT, () => {
            console.log(
                `OAuth server running on http://127.0.0.1:${OAUTH_PORT}`,
            );
            resolve(OAUTH_PORT);
        });

        server.on("error", (err) => {
            reject(err);
        });
    });
}

export function stopOAuthServer() {
    if (server) {
        server.close();
        server = null;
    }
}
