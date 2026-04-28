const mongoose = require('mongoose');

const secretSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:            { type: String, required: true },
  encryptedText:    { type: String, default: null },   // AES-encrypted text content
  filePath:         { type: String, default: null },   // path on disk
  originalFileName: { type: String, default: null },   // original upload name
  fileSize:         { type: Number, default: null },
  createdAt:        { type: Date, default: Date.now },
  updatedAt:        { type: Date, default: Date.now }
});

module.exports = mongoose.model('Secret', secretSchema);
