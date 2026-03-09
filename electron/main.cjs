const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
let sortHistory = [];

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'HALO.ico'),
    webPreferences: {
      // Make sure this points to your preload.cjs file
      preload: path.join(__dirname, 'preload.cjs'), 
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (app.isPackaged) {
    // When the app is installed (.exe), it loads the built files from the 'dist' folder
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    // While you are developing, it loads from your local Vite server
    mainWindow.loadURL('http://localhost:5173');
  }
}

app.whenReady().then(createWindow);

// --- FILE SYSTEM LOGIC ---

const categories = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'],
  docs: ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.csv', '.pptx', '.md', '.rtf'],
  media: ['.mp4', '.mkv', '.avi', '.mp3', '.wav', '.mov'],
  archives: ['.zip', '.rar', '.7z', '.tar', '.gz', '.iso', '.tgz'],
  code: ['.html', '.css', '.js', '.jsx', '.py', '.cpp', '.java', '.ipynb', '.json'],
  installers: ['.exe', '.msi', '.apk']
};

function getFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  for (const [type, exts] of Object.entries(categories)) {
    if (exts.includes(ext)) return type;
  }
  return 'others';
}

ipcMain.handle('get-default-path', () => {
  return app.getPath('desktop');
});

ipcMain.handle('scan-directory', async (event, folderPath) => {
  try {
    const files = fs.readdirSync(folderPath, { withFileTypes: true });
    const scannedFiles = files
      .filter(dirent => dirent.isFile())
      .map(dirent => ({
        name: dirent.name,
        type: getFileType(dirent.name)
      }))
      .filter(f => f.type !== 'others');

    return { success: true, files: scannedFiles };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sort-directory', async (event, folderPath, filesToSort) => {
  try {
    const folderMapping = {
      images: 'Images',
      docs: 'Documents',
      media: 'Media',
      archives: 'Archives',
      code: 'Code',
      installers: 'Installers'
    };

    for (const file of filesToSort) {
      const targetFolderName = folderMapping[file.type];
      const targetDir = path.join(folderPath, targetFolderName);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir);
      }

      const oldPath = path.join(folderPath, file.name);
      const newPath = path.join(targetDir, file.name);
      fs.renameSync(oldPath, newPath);
      sortHistory.push({ oldPath, newPath });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
// 3. Undo Sort API
ipcMain.handle('undo-sort', async () => {
  try {
    if (sortHistory.length === 0) return { success: false, error: 'No history to undo' };

    let count = 0;
    // Loop backwards to undo the most recent moves first
    for (let i = sortHistory.length - 1; i >= 0; i--) {
      const { oldPath, newPath } = sortHistory[i];
      if (fs.existsSync(newPath)) {
        fs.renameSync(newPath, oldPath);
        count++;
      }
    }
    
    // Clear the memory after a successful revert
    sortHistory = [];
    return { success: true, count };
  } catch (error) {
    return { success: false, error: error.message };
  }
});