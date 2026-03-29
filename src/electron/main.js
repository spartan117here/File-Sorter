const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load the React app
  mainWindow.loadURL('http://localhost:5173');
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

// 1. Scan Directory API
ipcMain.handle('scan-directory', async (event, folderPath) => {
  try {
    const files = fs.readdirSync(folderPath, { withFileTypes: true });
    const scannedFiles = files
      .filter(dirent => dirent.isFile())
      .map(dirent => ({
        name: dirent.name,
        type: getFileType(dirent.name)
      }))
      .filter(f => f.type !== 'others'); // Only grab files we know how to sort

    return { success: true, files: scannedFiles };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 2. Sort Directory API
ipcMain.handle('sort-directory', async (event, folderPath, filesToSort) => {
  try {
    const folderMapping = {
      images: 'Images',
      docs: 'Documents',
      media: 'Media',
      archives: 'Archives',
      code: 'Code',             // <-- ADD THIS
      installers: 'Installers'  // <-- ADD THIS
    };

    for (const file of filesToSort) {
      const targetFolderName = folderMapping[file.type];
      const targetDir = path.join(folderPath, targetFolderName);

      // Create folder if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir);
      }

      // Move the file
      const oldPath = path.join(folderPath, file.name);
      const newPath = path.join(targetDir, file.name);
      fs.renameSync(oldPath, newPath);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
