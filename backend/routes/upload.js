const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const upload = require('../middleware/upload');
const { uploadBuffer } = require('../utils/cloudinary');

const router = express.Router();

// ── POST /api/upload/prescription ─────────────────────────────────────────────
router.post('/prescription', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(422).json({ message: 'No file uploaded.' });

    const { url } = await uploadBuffer(req.file.buffer, 'batla-medicos/prescriptions', {
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    });

    res.json({ url });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/upload/image — admin product image ──────────────────────────────
router.post('/image', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(422).json({ message: 'No file uploaded.' });

    const { url } = await uploadBuffer(req.file.buffer, 'batla-medicos/products', {
      resource_type: 'image',
    });

    res.json({ url });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
