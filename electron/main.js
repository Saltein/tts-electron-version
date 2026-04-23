import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { startOAuthServer, stopOAuthServer } from "./oauthServer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

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

    // Запускаем OAuth сервер до загрузки окна
    await startOAuthServer(mainWindow);

    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL("http://localhost:5173");
    } else {
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }
}

// Стандартные IPC
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
    // Безопасно открываем ссылку в системном браузере
    shell.openExternal(url);
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    stopOAuthServer();
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("before-quit", () => {
    stopOAuthServer();
});
