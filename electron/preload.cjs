const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getDefaultPath: () => ipcRenderer.invoke('get-default-path'),
  getDirectories: () => ipcRenderer.invoke('get-directories'),
  scanDirectory: (path) => ipcRenderer.invoke('scan-directory', path),
  sortDirectory: (path, files) => ipcRenderer.invoke('sort-directory', path, files),
  undoSort: () => ipcRenderer.invoke('undo-sort'),
  validateDirectory: (path) => ipcRenderer.invoke('validate-directory', path),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getPathForFile: (file) => webUtils.getPathForFile(file)
});