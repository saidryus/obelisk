const path   = require('path');
const fs     = require('fs');
const Secret = require('../models/Secret');
const { encrypt, decrypt } = require('../utils/encryption');
const { logAction }        = require('../utils/logger');

/** GET /api/secrets — list metadata only (no decrypted content) */
async function getSecrets(req, res) {
  try {
    const secrets = await Secret.find({ userId: req.user.id })
      .select('title originalFileName fileSize createdAt updatedAt encryptedText filePath')
      .sort({ createdAt: -1 });

    // Return safe metadata — indicate what type each secret has
    const result = secrets.map(s => ({
      _id:              s._id,
      title:            s.title,
      hasText:          !!s.encryptedText,
      hasFile:          !!s.filePath,
      originalFileName: s.originalFileName,
      fileSize:         s.fileSize,
      createdAt:        s.createdAt,
      updatedAt:        s.updatedAt
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/** GET /api/secrets/:id — decrypt and return a single secret after re-auth */
async function getSecretById(req, res) {
  try {
    const secret = await Secret.findOne({ _id: req.params.id, userId: req.user.id });
    if (!secret) return res.status(404).json({ message: 'Secret not found' });

    const decryptedText = secret.encryptedText ? decrypt(secret.encryptedText) : null;
    await logAction(req.user.id, 'VIEW_SECRET', `Secret: ${secret.title}`);

    res.json({
      _id:              secret._id,
      title:            secret.title,
      content:          decryptedText,
      hasFile:          !!secret.filePath,
      originalFileName: secret.originalFileName,
      fileSize:         secret.fileSize,
      createdAt:        secret.createdAt,
      updatedAt:        secret.updatedAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/** POST /api/secrets — create with optional text + file */
async function createSecret(req, res) {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  if (!content && !req.file) return res.status(400).json({ message: 'Provide text content or a file' });

  try {
    const encryptedText    = content ? encrypt(content) : null;
    const filePath         = req.file ? req.file.filename : null;
    const originalFileName = req.file ? req.file.originalname : null;
    const fileSize         = req.file ? req.file.size : null;

    const secret = await Secret.create({
      userId: req.user.id, title, encryptedText, filePath, originalFileName, fileSize
    });

    if (req.file) await logAction(req.user.id, 'FILE_UPLOAD', `File: ${originalFileName}`);
    await logAction(req.user.id, 'CREATE_SECRET', `Secret: ${title}`);

    res.status(201).json({
      _id: secret._id, title: secret.title,
      hasText: !!encryptedText, hasFile: !!filePath,
      originalFileName, createdAt: secret.createdAt
    });
  } catch (err) {
    console.error('createSecret error:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
}

/** PUT /api/secrets/:id — update title and/or content */
async function updateSecret(req, res) {
  const { title, content } = req.body;
  try {
    const secret = await Secret.findOne({ _id: req.params.id, userId: req.user.id });
    if (!secret) return res.status(404).json({ message: 'Secret not found' });

    if (title)   secret.title = title;
    if (content) secret.encryptedText = encrypt(content);
    if (req.file) {
      // Remove old file if exists
      if (secret.filePath) {
        const oldPath = path.join(__dirname, '..', 'uploads', secret.filePath);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      secret.filePath         = req.file.filename;
      secret.originalFileName = req.file.originalname;
      secret.fileSize         = req.file.size;
      await logAction(req.user.id, 'FILE_UPLOAD', `Updated file: ${req.file.originalname}`);
    }
    secret.updatedAt = new Date();
    await secret.save();

    await logAction(req.user.id, 'UPDATE_SECRET', `Secret: ${secret.title}`);
    res.json({ _id: secret._id, title: secret.title, updatedAt: secret.updatedAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/** DELETE /api/secrets/:id */
async function deleteSecret(req, res) {
  try {
    const secret = await Secret.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!secret) return res.status(404).json({ message: 'Secret not found' });

    // Clean up file from disk
    if (secret.filePath) {
      const filePath = path.join(__dirname, '..', 'uploads', secret.filePath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await logAction(req.user.id, 'DELETE_SECRET', `Secret: ${secret.title}`);
    res.json({ message: 'Secret deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

/** GET /api/secrets/:id/download — authenticated file download */
async function downloadFile(req, res) {
  try {
    const secret = await Secret.findOne({ _id: req.params.id, userId: req.user.id });
    if (!secret || !secret.filePath) return res.status(404).json({ message: 'File not found' });

    const filePath = path.join(__dirname, '..', 'uploads', secret.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File missing on server' });

    await logAction(req.user.id, 'FILE_DOWNLOAD', `File: ${secret.originalFileName}`);
    res.download(filePath, secret.originalFileName);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getSecrets, getSecretById, createSecret, updateSecret, deleteSecret, downloadFile };
