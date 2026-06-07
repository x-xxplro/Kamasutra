const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process'); // ДЛЯ ОТКРЫТИЯ БРАУЗЕРА

// --------------------- CONFIG ---------------------
const PORT = process.env.PORT || 3000;
// ИСПРАВЛЕНО: ищем данные в папке backend/data
const DATA_DIR = path.resolve(__dirname, 'data');
const FRONTEND_DIR = path.resolve(__dirname, '../frontend');

// --------------------- LOGGING ---------------------
function logError(message, err) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, err || '');
}

function logInfo(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] INFO: ${message}`);
}

// --------------------- HELPER FUNC FOR EXCEL ---------------------
function getCellValue(row, col) {
  if (!row) return '';
  const cell = row[col];
  return cell !== undefined && cell !== null ? String(cell) : '';
}

function normalizeCellText(raw) {
  if (typeof raw !== 'string') return [];
  return raw
    .replace(/\\r?\\n|\\r/g, '\n')
    .split(/\r?\n|\r/)
    .map(s => s.trim())
    .filter(Boolean);
}

// --------------------- EXCEL PARSING ---------------------
function parseWorkbook(filePath, type, week) {
  let workbook;
  try {
    workbook = xlsx.readFile(filePath);
  } catch (err) {
    throw new Error(`Cannot open file: ${err.message}`);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel file contains no sheets');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const days = [];

  for (let col = 0; col < 6; col++) {
    const warmupRaw = getCellValue(rows[0], col);
    const mainRaw = getCellValue(rows[1], col);

    const warmup = normalizeCellText(warmupRaw);
    const dayIndex = col + 1;

    // Cardio: Tuesday (2), Thursday (4), Saturday (6)
    if ([2, 4, 6].includes(dayIndex)) {
      const cardioIntervals = normalizeCellText(mainRaw);
      days.push({
        dayIndex,
        warmup,
        exercises: [],
        isCardio: true,
        cardioIntervals,
      });
    } else {
      const exerciseLines = normalizeCellText(mainRaw);
      const exercises = exerciseLines.map(name => ({
        name,
      }));

      days.push({
        dayIndex,
        warmup,
        exercises,
        isCardio: false,
        cardioIntervals: null,
      });
    }
  }

  return {
    type,
    week: Number(week),
    days,
  };
}

// --------------------- IN-MEMORY CACHE ---------------------
let programCache = {
  male: {},
  female: {},
};

async function loadAllPrograms() {
  const types = ['male', 'female'];
  const weeks = [1, 2, 3, 4];

  const newCache = { male: {}, female: {} };
  let loadedCount = 0;

  for (const type of types) {
    for (const week of weeks) {
      const filePath = path.join(DATA_DIR, `${type}_week${week}.xlsx`);
      try {
        const program = parseWorkbook(filePath, type, week);
        newCache[type][week] = program;
        loadedCount++;
        logInfo(`Loaded ${type} week ${week}`);
      } catch (err) {
        logError(`Failed to load ${type} week ${week}`, err);
      }
    }
  }

  programCache = newCache;
  logInfo(`Program loading complete. ${loadedCount}/8 programs loaded.`);
}

// --------------------- ФУНКЦИЯ ДЛЯ ОТКРЫТИЯ БРАУЗЕРА ---------------------
function openBrowser(url) {
  const platform = process.platform;
  let command;
  
  if (platform === 'win32') { // Windows
    command = `start ${url}`;
  } else if (platform === 'darwin') { // macOS
    command = `open ${url}`;
  } else { // Linux
    command = `xdg-open ${url}`;
  }
  
  exec(command, (err) => {
    if (err) {
      logError('Failed to open browser automatically', err);
      console.log(`\n📍 Please open ${url} manually\n`);
    } else {
      logInfo(`Browser opened automatically at ${url}`);
    }
  });
}

// --------------------- EXPRESS APP ---------------------
const app = express();

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Middleware для парсинга JSON
app.use(express.json());

// Обслуживание статических файлов из папки frontend
app.use(express.static(FRONTEND_DIR));
app.use('/css', express.static(path.join(FRONTEND_DIR, 'css')));
app.use('/js', express.static(path.join(FRONTEND_DIR, 'js')));

// --------------------- API ROUTES ---------------------
app.get('/api/program/:type/:week', (req, res) => {
  const { type, week } = req.params;

  if (!['male', 'female'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  if (!['1', '2', '3', '4'].includes(week)) {
    return res.status(400).json({ error: 'Invalid week' });
  }

  const program = programCache[type]?.[week];
  if (!program) {
    return res.status(404).json({
      error: 'Program not found',
      message: `${type} week ${week} not found`,
    });
  }

  return res.json(program);
});

app.get('/api/programs', (req, res) => {
  const result = {
    male: Object.keys(programCache.male).map(Number),
    female: Object.keys(programCache.female).map(Number),
  };
  return res.json(result);
});

app.get('/health', (req, res) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/admin/reload', async (req, res) => {
  try {
    await loadAllPrograms();
    return res.json({ success: true });
  } catch (err) {
    logError('Reload failed', err);
    return res.status(500).json({
      error: 'Reload failed',
      details: err.message,
    });
  }
});

// Маршруты для HTML страниц
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.get('/train.html', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'train.html'));
});

// 404 handler
app.use((req, res) => {
  if (req.accepts('html')) {
    res.status(404).sendFile(path.join(FRONTEND_DIR, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Error handler
app.use((err, req, res, _next) => {
  logError('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// --------------------- START ---------------------
(async () => {
  await loadAllPrograms();
  app.listen(PORT, () => {
    logInfo(`Server started on port ${PORT}`);
    logInfo(`Data directory: ${DATA_DIR}`);
    logInfo(`Frontend directory: ${FRONTEND_DIR}`);
    
    const url = `http://localhost:${PORT}`;
    console.log(`\n✨ Server is running! ✨`);
    console.log(`📍 ${url}\n`);
    
    // АВТОМАТИЧЕСКИ ОТКРЫВАЕМ БРАУЗЕР
    openBrowser(url);
  });
})();