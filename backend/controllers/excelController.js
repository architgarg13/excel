const XLSX = require('xlsx');
const fs = require('fs');
const File = require('../models/File');

exports.uploadExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);

    const worksheets = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const firstRow = jsonData[0] || [];
      const headers = firstRow
        .map((h) => (h != null && String(h).trim() !== '' ? String(h) : null))
        .filter((h) => h !== null);

      return { name, headers };
    });

    const fileRecord = await File.create({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      worksheets,
    });

    // Clean up temp file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete temp file:', err);
    });

    res.status(201).json({
      message: 'File processed successfully',
      data: fileRecord,
    });
  } catch (error) {
    // Clean up temp file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
};

exports.getFiles = async (req, res, next) => {
  try {
    const files = await File.find().sort({ uploadedAt: -1 }).limit(50);
    res.json({ data: files });
  } catch (error) {
    next(error);
  }
};
