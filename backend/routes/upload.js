const express = require('express');
const multer = require('multer');
const path = require('path');
const excelController = require('../controllers/excelController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${sanitized}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  const allowedExts = ['.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only .xlsx and .xls files are allowed.');
    error.type = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Session endpoints
router.post('/session', excelController.createSession);
router.get('/session/:id/status', excelController.getSessionStatus);

// Per-sheet upload (file)
router.post('/session/:id/upload/:sheetType', upload.single('file'), excelController.uploadSheet);

// Per-sheet paste (JSON)
router.post('/session/:id/paste/:sheetType', excelController.pasteSheet);

// Header mapping
router.put('/session/:id/mapping/:sheetType', excelController.saveMapping);

// Generate IC output
router.post('/session/:id/generate', excelController.generateOutput);

// Download IC output as .xlsx
router.get('/session/:id/download', excelController.downloadOutput);

module.exports = router;
