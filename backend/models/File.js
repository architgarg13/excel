const mongoose = require('mongoose');

const sheetSchema = new mongoose.Schema({
  sheetType: { type: String, required: true },
  originalName: String,
  headers: [String],
  headerMapping: { type: Map, of: String, default: {} },
  data: { type: [[mongoose.Schema.Types.Mixed]], default: [] },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  sheets: [sheetSchema],
  output: { type: [[mongoose.Schema.Types.Mixed]], default: null },
  outputHeaders: { type: [String], default: null },
  uploadedFilePath: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);
