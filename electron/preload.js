const { contextBridge, ipcRenderer, shell } = require("electron");

console.log("PRELOAD LOADED");

contextBridge.exposeInMainWorld("electronAPI", {
    close: () => ipcRenderer.send("window-close"),
    minimize: () => ipcRenderer.send("window-minimize"),
    maximize: () => ipcRenderer.send("window-maximize"),
    openExternal: (url) => ipcRenderer.send("open-external", url),
    onGoogleOAuthCode: (callback) => {
        const handler = (event, code) => callback(code);
        ipcRenderer.on("google-oauth-code", handler);
        // Возвращаем функцию для отписки
        return () => ipcRenderer.removeListener("google-oauth-code", handler);
    },
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    },

    startTTSServer: () => ipcRenderer.invoke("tts-start"),
    stopTTSServer: () => ipcRenderer.invoke("tts-stop"),
    onTTSError: (callback) => {
        const handler = (event, error) => callback(error);
        ipcRenderer.on("tts-server-error", handler);
        return () => ipcRenderer.removeListener("tts-server-error", handler);
    },
});
