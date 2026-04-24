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

// Функция для получения правильного пути к TTS серверу в production
function getTTSServerPath() {
    const isDev = !app.isPackaged;

    if (isDev) {
        // В режиме разработки - из папки electron/tts_server
        return path.join(__dirname, "tts_server", "tts-chat-server.exe");
    } else {
        // В production - из resources/app.asar.unpacked или resources/electron/tts_server
        // Путь зависит от того, как упакован exe файл

        // Вариант 1: exe находится в ресурсах рядом с app.asar
        const possiblePaths = [
            path.join(
                process.resourcesPath,
                "app.asar.unpacked",
                "electron",
                "tts_server",
                "tts-chat-server.exe",
            ),
            path.join(
                process.resourcesPath,
                "electron",
                "tts_server",
                "tts-chat-server.exe",
            ),
            path.join(
                path.dirname(app.getPath("exe")),
                "resources",
                "electron",
                "tts_server",
                "tts-chat-server.exe",
            ),
            path.join(__dirname, "tts_server", "tts-chat-server.exe"), // fallback
        ];

        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath)) {
                console.log(`Found TTS server at: ${testPath}`);
                return testPath;
            }
        }

        // Если не нашли, возвращаем путь по умолчанию
        return path.join(
            process.resourcesPath,
            "electron",
            "tts_server",
            "tts-chat-server.exe",
        );
    }
}

// Функция для запуска TTS сервера
async function startTTSServer() {
    const serverPath = getTTSServerPath();

    // Проверяем существует ли файл
    if (!fs.existsSync(serverPath)) {
        console.error(`TTS server not found at: ${serverPath}`);
        console.log("Resources path:", process.resourcesPath);
        console.log("App path:", app.getAppPath());
        console.log("Exe path:", app.getPath("exe"));

        // Попробуем вывести список файлов в resources для отладки
        try {
            if (fs.existsSync(process.resourcesPath)) {
                const files = fs.readdirSync(process.resourcesPath);
                console.log("Files in resources:", files);

                // Проверяем наличие папки electron
                const electronPath = path.join(
                    process.resourcesPath,
                    "electron",
                );
                if (fs.existsSync(electronPath)) {
                    const electronFiles = fs.readdirSync(electronPath);
                    console.log("Files in resources/electron:", electronFiles);

                    const ttsPath = path.join(electronPath, "tts_server");
                    if (fs.existsSync(ttsPath)) {
                        const ttsFiles = fs.readdirSync(ttsPath);
                        console.log(
                            "Files in resources/electron/tts_server:",
                            ttsFiles,
                        );
                    }
                }
            }
        } catch (err) {
            console.error("Error listing resources:", err);
        }

        return false;
    }

    return new Promise((resolve, reject) => {
        try {
            console.log(`Starting TTS server from: ${serverPath}`);

            // Запускаем exe файл с правильной рабочей директорией
            const serverDir = path.dirname(serverPath);
            ttsServerProcess = spawn(serverPath, [], {
                cwd: serverDir, // Устанавливаем рабочую директорию
                detached: false,
                stdio: ["ignore", "pipe", "pipe"],
                windowsHide: true, // Скрываем окно консоли на Windows
            });

            // Логируем вывод сервера
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
    return new Promise((resolve) => {
        if (!ttsServerProcess || ttsServerProcess.killed) {
            ttsServerProcess = null;
            resolve();
            return;
        }

        console.log("Stopping TTS server...");
        const pid = ttsServerProcess.pid;

        const cleanup = () => {
            ttsServerProcess = null;
            resolve();
        };

        if (process.platform === "win32") {
            exec(`taskkill /pid ${pid} /f /t`, (error) => {
                if (error) {
                    console.error(
                        "Error killing TTS server process tree:",
                        error,
                    );
                    try {
                        process.kill(pid, "SIGKILL");
                    } catch (e) {}
                }
                cleanup();
            });
        } else {
            ttsServerProcess.kill("SIGTERM");
            setTimeout(() => {
                if (ttsServerProcess && !ttsServerProcess.killed) {
                    ttsServerProcess.kill("SIGKILL");
                }
                cleanup();
            }, 5000);
        }
    });
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

    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL("http://localhost:5173");
    } else {
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }
}

// включение - выключение TTS сервера
ipcMain.handle("tts-start", async (event) => {
    if (ttsServerProcess && !ttsServerProcess.killed) {
        console.log("TTS server is already running");
        return true;
    }
    try {
        await startTTSServer();
        return true;
    } catch (error) {
        console.error("Failed to start TTS server:", error);
        if (mainWindow) {
            mainWindow.webContents.send("tts-server-error", error.message);
        }
        return false;
    }
});

ipcMain.handle("tts-stop", async (event) => {
    if (!ttsServerProcess || ttsServerProcess.killed) {
        return true;
    }
    await stopTTSServer();
    return true;
});

// Остальные IPC обработчики
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
    stopTTSServer();
    stopOAuthServer();
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("before-quit", () => {
    stopTTSServer();
    stopOAuthServer();
});

app.on("will-quit", () => {
    stopTTSServer();
});
