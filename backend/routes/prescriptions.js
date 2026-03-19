const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { query: queryValidator, param, validationResult } = require('express-validator');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const upload = require('../middleware/upload');
const { query, execute } = require('../db/mysql');

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

function mapPrescription(row) {
  return {
    _id: String(row.id),
    user: row.user_id ? { _id: String(row.user_id), name: row.user_name || '', email: row.user_email || '' } : null,
    imageUrl: row.image_url,
    status: row.status,
    adminNotes: row.admin_notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// POST /api/prescriptions — upload a prescription
router.post('/', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(422).json({ message: 'No file uploaded.' });
    const url = saveFile(req.file.buffer, 'prescriptions', req.file.originalname);
    const result = await execute(
      'INSERT INTO prescriptions (user_id, image_url) VALUES (?, ?)',
      [req.user.id, url]
    );
    res.status(201).json({ _id: String(result.insertId), imageUrl: url, status: 'pending' });
  } catch (err) { next(err); }
});

// GET /api/prescriptions/my — customer's prescriptions
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      'SELECT * FROM prescriptions WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows.map(r => mapPrescription({ ...r, user_name: req.user.name, user_email: req.user.email })));
  } catch (err) { next(err); }
});

// GET /api/prescriptions — admin: all prescriptions
router.get('/', requireAuth, requireAdmin, [
  queryValidator('page').optional().isInt({ min: 1 }).toInt(),
  queryValidator('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  queryValidator('status').optional().trim(),
], async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status;

    let whereSql = '';
    const vals = [];
    if (statusFilter) {
      whereSql = 'WHERE p.status = ?';
      vals.push(statusFilter);
    }

    const [rows, countRows] = await Promise.all([
      query(
        `SELECT p.*, u.name AS user_name, u.email AS user_email
         FROM prescriptions p LEFT JOIN users u ON u.id = p.user_id
         ${whereSql} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
        [...vals, limit, offset]
      ),
      query(`SELECT COUNT(*) AS total FROM prescriptions p ${whereSql}`, vals),
    ]);
    const total = Number(countRows[0]?.total || 0);
    res.json({
      prescriptions: rows.map(mapPrescription),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) { next(err); }
});

// PATCH /api/prescriptions/:id — admin update status
router.patch('/:id', requireAuth, requireAdmin, [param('id').isInt({ min: 1 })], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    const { status, adminNotes } = req.body;
    const sets = [];
    const vals = [];
    if (status) { sets.push('status = ?'); vals.push(status); }
    if (adminNotes !== undefined) { sets.push('admin_notes = ?'); vals.push(adminNotes); }
    if (!sets.length) return res.status(422).json({ message: 'Nothing to update.' });
    vals.push(req.params.id);
    await execute(`UPDATE prescriptions SET ${sets.join(', ')} WHERE id = ?`, vals);
    res.json({ message: 'Prescription updated.' });
  } catch (err) { next(err); }
});

// DELETE /api/prescriptions/:id
router.delete('/:id', requireAuth, [param('id').isInt({ min: 1 })], async (req, res, next) => {
  try {
    // Customers can only delete their own
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      const rows = await query('SELECT id FROM prescriptions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
      if (!rows.length) return res.status(403).json({ message: 'Not authorized.' });
    }
    await execute('DELETE FROM prescriptions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Prescription deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
