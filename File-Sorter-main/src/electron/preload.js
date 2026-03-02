const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  scanDirectory: (path) => ipcRenderer.invoke('scan-directory', path),
  sortDirectory: (path, files) => ipcRenderer.invoke('sort-directory', path, files)
});
