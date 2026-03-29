const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const util = require('util');
const execFilePromise = util.promisify(execFile);
let sortHistory = [];

function createWindow() {
  const mainWindow = new BrowserWindow({
    title: 'Sortify',
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

  const isDev = !app.isPackaged;

  if (isDev) {
    // Try to load from the dev server first
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      // If dev server fails (e.g. not running), load the built file as a fallback
      console.log('Dev server not detected, loading production build...');
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  } else {
    // Producton build (packaged)
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle window closing
  mainWindow.on('closed', () => {
    app.quit();
  });
}

// --- PERSISTENT CACHE ---
const CACHE_FILE = path.join(app.getPath('userData'), 'ai_cache.json');
let aiCache = {};

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      aiCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      console.log(`[Cache] Loaded ${Object.keys(aiCache).length} entries.`);
    }
  } catch (err) {
    console.error('[Cache] Error loading:', err.message);
  }
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(aiCache, null, 2));
  } catch (err) {
    console.error('[Cache] Error saving:', err.message);
  }
}

// Initial load
loadCache();

app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

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

ipcMain.handle('get-directories', () => {
  return [
    { name: 'Desktop', path: app.getPath('desktop') },
    { name: 'Downloads', path: app.getPath('downloads') },
    { name: 'Documents', path: app.getPath('documents') },
    { name: 'C:\\ Drive (System)', path: 'C:\\', disabled: true },
    { name: 'D:\\ Drive (Restricted)', path: 'D:\\', disabled: true }
  ];
});

const crypto = require('crypto');

/**
 * Generates a simple name based on filename cleanup.
 */
function getSmartName(file) {
  const ext = path.extname(file.name);
  const rawBase = file.name.replace(ext, '');
  const words = rawBase.split(/[_\s-]+/).filter(w => w.length > 0);
  let baseName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_');
  
  // Media-specific cleanup
  if (file.type === 'media') {
    if (baseName.startsWith('Vid_') || baseName.startsWith('Video_')) baseName = 'Video';
    if (baseName.startsWith('Aud_') || baseName.startsWith('Audio_')) baseName = 'Audio';
  }

  // Fallback if name is too short or empty
  if (!baseName || baseName.length < 2) {
    const fallbacks = { images: 'Image', docs: 'Document', media: 'Media', code: 'Code', archives: 'Archive', installers: 'Installer' };
    baseName = fallbacks[file.type] || 'File';
  }

  return baseName;
}

/**
 * Generates a unique filename in a directory to prevent overwriting.
 */
function getUniqueName(directory, baseName, extension) {
  let counter = 1;
  while (true) {
    const newName = `${baseName}_${counter}${extension}`;
    const fullPath = path.join(directory, newName);
    if (!fs.existsSync(fullPath)) return newName;
    counter++;
  }
}

ipcMain.handle('scan-directory', async (event, folderPath) => {
  try {
    const files = fs.readdirSync(folderPath, { withFileTypes: true });
    const scannedFiles = files
      .filter(dirent => dirent.isFile())
      .map(dirent => {
        const fullPath = path.join(folderPath, dirent.name);
        try {
          const stats = fs.statSync(fullPath);
          return {
            name: dirent.name,
            type: getFileType(dirent.name),
            path: fullPath,
            size: stats.size
          };
        } catch (e) {
          return {
            name: dirent.name,
            type: getFileType(dirent.name),
            path: fullPath,
            size: 0
          };
        }
      })
      .filter(f => f.type !== 'others');

    return { success: true, files: scannedFiles, duplicatesCount: 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sort-directory', async (event, folderPath, filesToSort) => {
  try {
    const startTime = Date.now();
    const folderMapping = {
      images: 'Images',
      docs: 'Documents',
      media: 'Media',
      archives: 'Archives',
      code: 'Code',
      installers: 'Installers'
    };

    // Pre-create folders
    const categoriesSorted = [...new Set(filesToSort.map(f => f.type))];
    for (const type of categoriesSorted) {
      const targetDir = path.join(folderPath, folderMapping[type] || 'Others');
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    }

    for (const file of filesToSort) {
      try {
        const targetFolderName = folderMapping[file.type] || 'Others';
        const targetDir = path.join(folderPath, targetFolderName);
        
        const smartBaseName = getSmartName(file);
        const extension = path.extname(file.name);
        const finalFileName = getUniqueName(targetDir, smartBaseName, extension);

        const oldPath = path.join(folderPath, file.name);
        const newPath = path.join(targetDir, finalFileName);
        
        // Skip if already there (edge case)
        if (oldPath === newPath) continue;

        fs.renameSync(oldPath, newPath);
        sortHistory.push({ oldPath, newPath });
      } catch (fileError) {
        // Silent fail for individual files to keep speed
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Sortify] Sorted ${filesToSort.length} files in ${duration}ms.\n`);
    
    return { success: true, duration };
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