const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const requireAuth = require('../middleware/requireAuth');
const upload = require('../middleware/upload');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function saveFile(buffer, subfolder, originalName) {
  const dir = path.join(UPLOADS_DIR, subfolder);
  ensureDir(dir);
  const ext = path.extname(originalName || '.jpg').toLowerCase();
  const name = crypto.randomBytes(16).toString('hex') + ext;
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${subfolder}/${name}`;
}

// ── POST /api/upload/prescription ─────────────────────────────────────────────
router.post('/prescription', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(422).json({ message: 'No file uploaded.' });
    const url = saveFile(req.file.buffer, 'prescriptions', req.file.originalname);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/upload/image — admin product image ──────────────────────────────
router.post('/image', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(422).json({ message: 'No file uploaded.' });
    const url = saveFile(req.file.buffer, 'products', req.file.originalname);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
