const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Session = require('../models/File');
const { SHEET_TYPES, SHEET_ORDER, matchWorksheetToSheetType, matchByHeaders } = require('../config/sheetConfig');
const { calculateIC } = require('../services/icCalculator');

// Auto-match uploaded headers to expected headers (case-insensitive)
function autoMatchHeaders(uploadedHeaders, expectedHeaders) {
  const mapping = {};
  const matched = [];
  const needsMapping = [];

  for (const expected of expectedHeaders) {
    const found = uploadedHeaders.find(
      (h) => h.toLowerCase().trim() === expected.toLowerCase().trim()
    );
    if (found) {
      mapping[expected] = found;
      matched.push(expected);
    } else {
      needsMapping.push(expected);
    }
  }

  return { mapping, matched, needsMapping };
}

// Extract headers and data rows from a worksheet
function extractSheetData(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const headerRow = jsonData[0] || [];
  const uploadedHeaders = headerRow
    .map((h) => (h != null && String(h).trim() !== '' ? String(h).trim() : null))
    .filter((h) => h !== null);

  const dataRows = jsonData.slice(1).filter((row) =>
    row.some((cell) => cell != null && String(cell).trim() !== '')
  );

  return { uploadedHeaders, dataRows };
}

exports.createSession = async (req, res, next) => {
  try {
    const sessionId = uuidv4();
    await Session.create({ sessionId, sheets: [] });
    res.status(201).json({ sessionId });
  } catch (error) {
    next(error);
  }
};

exports.uploadWorkbook = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Session not found' });
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const worksheetNames = workbook.SheetNames;

    const matchedSheets = [];
    const unmatchedWorksheets = [];
    const matchedTypes = new Set();
    const sheetsNeedingHeaderMapping = [];

    // Pass 1: Name-based matching
    const nameMatches = {}; // wsName -> sheetType
    for (const wsName of worksheetNames) {
      const sheetType = matchWorksheetToSheetType(wsName);
      if (sheetType && !matchedTypes.has(sheetType)) {
        nameMatches[wsName] = sheetType;
        matchedTypes.add(sheetType);
      }
    }

    // Pass 2: Header-based matching for unmatched worksheets
    const headerMatches = {};
    for (const wsName of worksheetNames) {
      if (nameMatches[wsName]) continue;
      const { uploadedHeaders } = extractSheetData(workbook, wsName);
      const unmatchedTypes = SHEET_ORDER.filter(t => !matchedTypes.has(t));
      if (unmatchedTypes.length === 0) break;
      const bestMatch = matchByHeaders(uploadedHeaders, unmatchedTypes);
      if (bestMatch) {
        headerMatches[wsName] = bestMatch;
        matchedTypes.add(bestMatch);
      }
    }

    // Process all matched worksheets
    session.sheets = [];
    const allMatches = { ...nameMatches, ...headerMatches };

    for (const [wsName, sheetType] of Object.entries(allMatches)) {
      const { uploadedHeaders, dataRows } = extractSheetData(workbook, wsName);
      const expectedHeaders = SHEET_TYPES[sheetType].expectedHeaders;
      const { mapping, matched, needsMapping } = autoMatchHeaders(uploadedHeaders, expectedHeaders);

      session.sheets.push({
        sheetType,
        originalName: wsName,
        headers: uploadedHeaders,
        headerMapping: mapping,
        data: dataRows,
        uploadedAt: new Date()
      });

      const sheetInfo = {
        sheetType,
        label: SHEET_TYPES[sheetType].label,
        worksheetName: wsName,
        rowCount: dataRows.length,
        headerCount: uploadedHeaders.length,
        uploadedHeaders,
        autoMatched: matched,
        needsMapping,
        mapping
      };
      matchedSheets.push(sheetInfo);

      if (needsMapping.length > 0) {
        sheetsNeedingHeaderMapping.push(sheetType);
      }
    }

    // Collect unmatched worksheets
    for (const wsName of worksheetNames) {
      if (!allMatches[wsName]) {
        const { uploadedHeaders, dataRows } = extractSheetData(workbook, wsName);
        unmatchedWorksheets.push({
          worksheetName: wsName,
          headerCount: uploadedHeaders.length,
          rowCount: dataRows.length,
          sampleHeaders: uploadedHeaders.slice(0, 5)
        });
      }
    }

    const missingSheetTypes = SHEET_ORDER
      .filter(t => !matchedTypes.has(t))
      .map(t => ({ sheetType: t, label: SHEET_TYPES[t].label }));

    // Store file path for potential re-reading during mapWorksheets
    session.uploadedFilePath = filePath;
    await session.save();

    res.json({
      matchedSheets,
      missingSheetTypes,
      unmatchedWorksheets,
      allMatched: missingSheetTypes.length === 0,
      sheetsNeedingHeaderMapping
    });
  } catch (error) {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
};

exports.mapWorksheets = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const { worksheetMappings } = req.body;

    if (!worksheetMappings || typeof worksheetMappings !== 'object') {
      return res.status(400).json({ error: 'Invalid worksheetMappings object' });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.uploadedFilePath || !fs.existsSync(session.uploadedFilePath)) {
      return res.status(400).json({ error: 'Uploaded workbook file not found. Please re-upload.' });
    }

    const workbook = XLSX.readFile(session.uploadedFilePath);
    const newlyMatched = [];
    const sheetsNeedingHeaderMapping = [];

    for (const [wsName, sheetType] of Object.entries(worksheetMappings)) {
      if (!SHEET_TYPES[sheetType]) {
        return res.status(400).json({ error: `Invalid sheet type: ${sheetType}` });
      }
      if (!workbook.SheetNames.includes(wsName)) {
        return res.status(400).json({ error: `Worksheet "${wsName}" not found in workbook` });
      }

      const { uploadedHeaders, dataRows } = extractSheetData(workbook, wsName);
      const expectedHeaders = SHEET_TYPES[sheetType].expectedHeaders;
      const { mapping, matched, needsMapping } = autoMatchHeaders(uploadedHeaders, expectedHeaders);

      // Remove existing sheet of same type
      session.sheets = session.sheets.filter(s => s.sheetType !== sheetType);
      session.sheets.push({
        sheetType,
        originalName: wsName,
        headers: uploadedHeaders,
        headerMapping: mapping,
        data: dataRows,
        uploadedAt: new Date()
      });

      const sheetInfo = {
        sheetType,
        label: SHEET_TYPES[sheetType].label,
        worksheetName: wsName,
        rowCount: dataRows.length,
        headerCount: uploadedHeaders.length,
        uploadedHeaders,
        autoMatched: matched,
        needsMapping,
        mapping
      };
      newlyMatched.push(sheetInfo);

      if (needsMapping.length > 0) {
        sheetsNeedingHeaderMapping.push(sheetType);
      }
    }

    await session.save();

    // Build full summary
    const matchedTypes = new Set(session.sheets.map(s => s.sheetType));
    const missingSheetTypes = SHEET_ORDER
      .filter(t => !matchedTypes.has(t))
      .map(t => ({ sheetType: t, label: SHEET_TYPES[t].label }));

    res.json({
      newlyMatched,
      missingSheetTypes,
      allMatched: missingSheetTypes.length === 0,
      sheetsNeedingHeaderMapping
    });
  } catch (error) {
    next(error);
  }
};

exports.saveMapping = async (req, res, next) => {
  try {
    const { id: sessionId, sheetType } = req.params;
    const { mapping } = req.body;

    if (!mapping || typeof mapping !== 'object') {
      return res.status(400).json({ error: 'Invalid mapping object' });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sheet = session.sheets.find((s) => s.sheetType === sheetType);
    if (!sheet) {
      return res.status(404).json({ error: `Sheet ${sheetType} not found in session` });
    }

    sheet.headerMapping = mapping;
    await session.save();

    res.json({ message: 'Mapping saved', sheetType });
  } catch (error) {
    next(error);
  }
};

exports.getSessionStatus = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const status = {};
    for (const type of SHEET_ORDER) {
      const sheet = session.sheets.find((s) => s.sheetType === type);
      if (!sheet) {
        status[type] = { uploaded: false, mapped: false, label: SHEET_TYPES[type].label };
      } else {
        const expectedHeaders = SHEET_TYPES[type].expectedHeaders;
        const mappingKeys = sheet.headerMapping ? Object.keys(Object.fromEntries(sheet.headerMapping)) : [];
        const allMapped = expectedHeaders.every((h) => mappingKeys.includes(h));
        status[type] = {
          uploaded: true,
          mapped: allMapped,
          label: SHEET_TYPES[type].label,
          originalName: sheet.originalName,
          rowCount: sheet.data.length,
          headerCount: sheet.headers.length
        };
      }
    }

    res.json({ sessionId, status, hasOutput: !!session.output });
  } catch (error) {
    next(error);
  }
};

exports.generateOutput = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check all 9 sheets are uploaded
    for (const type of SHEET_ORDER) {
      const sheet = session.sheets.find((s) => s.sheetType === type);
      if (!sheet) {
        return res.status(400).json({ error: `Missing sheet: ${SHEET_TYPES[type].label}` });
      }
    }

    // Build data maps using header mappings
    const sheetData = {};
    for (const sheet of session.sheets) {
      const mapping = sheet.headerMapping ? Object.fromEntries(sheet.headerMapping) : {};
      const expectedHeaders = SHEET_TYPES[sheet.sheetType].expectedHeaders;

      // Build column index map: expectedHeader -> column index in data
      const colMap = {};
      for (const expected of expectedHeaders) {
        const uploadedHeader = mapping[expected] || expected;
        const idx = sheet.headers.indexOf(uploadedHeader);
        if (idx !== -1) {
          colMap[expected] = idx;
        }
      }

      // Convert data rows to objects using the mapping
      const rows = sheet.data.map((row) => {
        const obj = {};
        for (const [expected, idx] of Object.entries(colMap)) {
          obj[expected] = row[idx] != null ? row[idx] : null;
        }
        return obj;
      });

      sheetData[sheet.sheetType] = rows;
    }

    const { headers: outputHeaders, rows: outputRows } = calculateIC(sheetData);

    session.output = outputRows;
    session.outputHeaders = outputHeaders;

    // Clean up uploaded workbook file
    if (session.uploadedFilePath) {
      fs.unlink(session.uploadedFilePath, (err) => {
        if (err) console.error('Failed to delete uploaded workbook:', err);
      });
      session.uploadedFilePath = null;
    }

    await session.save();

    res.json({
      headers: outputHeaders,
      rows: outputRows,
      rowCount: outputRows.length
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadOutput = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const session = await Session.findOne({ sessionId });
    if (!session || !session.output || !session.outputHeaders) {
      return res.status(404).json({ error: 'No output generated yet' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('IC Output - HUB');

    // Add headers
    worksheet.addRow(session.outputHeaders);

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows
    for (const row of session.output) {
      worksheet.addRow(row);
    }

    // Auto-width columns
    worksheet.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const val = cell.value ? String(cell.value) : '';
        maxLen = Math.max(maxLen, val.length);
      });
      col.width = Math.min(maxLen + 2, 30);
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=IC_Output_HUB.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};
