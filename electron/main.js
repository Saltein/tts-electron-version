import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { startOAuthServer, stopOAuthServer } from "./oauthServer.js";
import { spawn, exec } from "child_process";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let ttsServerProcess = null;

// Функция для запуска TTS сервера
async function startTTSServer() {
    console.log("Starting TTS server...");
    const serverPath = path.join(
        __dirname,
        "tts_server",
        "tts-chat-server.exe",
    );

    // Проверяем существует ли файл
    if (!fs.existsSync(serverPath)) {
        console.error(`TTS server not found at: ${serverPath}`);
        return false;
    }

    return new Promise((resolve, reject) => {
        try {
            // Запускаем exe файл
            ttsServerProcess = spawn(serverPath, [], {
                detached: false, // false чтобы процесс закрывался при закрытии приложения
                stdio: ["ignore", "pipe", "pipe"], // перехватываем stdout и stderr
            });

            // Логируем вывод сервера (опционально)
            ttsServerProcess.stdout.on("data", (data) => {
                console.log(`[TTS Server]: ${data}`);
            });

            ttsServerProcess.stderr.on("data", (data) => {
                console.error(`[TTS Server Error]: ${data}`);
            });

            ttsServerProcess.on("error", (err) => {
                console.error("Failed to start TTS server:", err);
                reject(err);
            });

            ttsServerProcess.on("spawn", () => {
                console.log("TTS Server started successfully");
                resolve(true);
            });

            // Даем серверу время на запуск
            setTimeout(() => resolve(true), 2000);
        } catch (error) {
            console.error("Error starting TTS server:", error);
            reject(error);
        }
    });
}

// Функция для остановки TTS сервера
function stopTTSServer() {
    if (ttsServerProcess && !ttsServerProcess.killed) {
        console.log("Stopping TTS server...");

        // Пытаемся завершить процесс
        ttsServerProcess.kill("SIGTERM");

        // Принудительное завершение через 5 секунд, если не закрылся
        setTimeout(() => {
            if (ttsServerProcess && !ttsServerProcess.killed) {
                ttsServerProcess.kill("SIGKILL");
            }
        }, 5000);

        ttsServerProcess = null;
    }
}

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 960,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            devTools: true,
        },
    });

    // Запускаем OAuth сервер
    await startOAuthServer(mainWindow);

    // Запускаем TTS сервер
    try {
        await startTTSServer();
    } catch (error) {
        console.error("Failed to start TTS server:", error);
        // Можно показать диалог об ошибке пользователю
    }

    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL("http://localhost:5173");
    } else {
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }
}

// Остальные IPC обработчики остаются без изменений
ipcMain.on("window-close", (event) => {
    event.sender.getOwnerBrowserWindow().close();
});

ipcMain.on("window-minimize", (event) => {
    event.sender.getOwnerBrowserWindow().minimize();
});

ipcMain.on("window-maximize", (event) => {
    const win = event.sender.getOwnerBrowserWindow();
    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }
});

ipcMain.on("open-external", (event, url) => {
    shell.openExternal(url);
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    stopTTSServer(); // Останавливаем TTS сервер
    stopOAuthServer();
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("before-quit", () => {
    stopTTSServer(); // Останавливаем TTS сервер
    stopOAuthServer();
});

// Опционально: обработка события закрытия приложения
app.on("will-quit", () => {
    stopTTSServer();
});
