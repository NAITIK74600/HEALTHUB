'use strict';

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const requireAuth   = require('../middleware/requireAuth');
const requireAdmin  = require('../middleware/requireAdmin');
const upload        = require('../middleware/upload');
const { uploadBuffer, deleteByPublicId } = require('../utils/cloudinary');
const { query, execute } = require('../db/mysql');

const router = express.Router();

function mapBrand(row) {
  return {
    _id:      String(row.id),
    name:     row.name,
    slug:     row.slug,
    logoUrl:  row.logo_url || null,
    gradient: row.gradient || '',
    category: row.category,
    ord:      Number(row.ord || 0),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function slugify(str) {
  return String(str || '').trim().toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractPublicId(url) {
  const match = String(url || '').match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w{2,5})?$/);
  return match ? match[1] : null;
}

// ── Public: get all active brands (optionally filtered by category) ──────────
router.get('/', async (req, res, next) => {
  try {
    const cat = req.query.category;
    let sql = 'SELECT * FROM brands WHERE is_active = 1';
    const vals = [];
    if (cat && ['featured', 'ayurvedic', 'general', 'personal_care'].includes(cat)) {
      sql += ' AND category = ?';
      vals.push(cat);
    }
    sql += ' ORDER BY ord ASC, name ASC';
    const rows = await query(sql, vals);
    res.json({ brands: rows.map(mapBrand) });
  } catch (err) { next(err); }
});

// ── Admin: get all brands (including inactive) ────────────────────────────────
router.get('/admin/all', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM brands ORDER BY ord ASC, name ASC', []);
    res.json({ brands: rows.map(mapBrand) });
  } catch (err) { next(err); }
});

// ── Admin: create brand ───────────────────────────────────────────────────────
router.post('/', requireAuth, requireAdmin, upload.single('logo'), [
  body('name').trim().notEmpty().isLength({ max: 150 }),
  body('category').isIn(['featured', 'ayurvedic', 'general', 'personal_care']),
  body('ord').optional().isInt({ min: 0 }).toInt(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const slugBase = slugify(req.body.name);
    let slug = slugBase;
    let suffix = 2;
    while ((await query('SELECT id FROM brands WHERE slug = ? LIMIT 1', [slug])).length) {
      slug = `${slugBase}-${suffix}`;
      suffix += 1;
    }

    let logoUrl = null;
    if (req.file) {
      const { url } = await uploadBuffer(req.file.buffer, 'batla-medicos/brands');
      logoUrl = url;
    } else if (req.body.logoUrl && /^https?:\/\//i.test(String(req.body.logoUrl))) {
      logoUrl = String(req.body.logoUrl).trim();
    }

    const gradient = req.body.gradient ? String(req.body.gradient).trim() : '';

    const result = await execute(
      `INSERT INTO brands (name, slug, logo_url, gradient, category, ord, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        req.body.name.trim(),
        slug,
        logoUrl,
        gradient,
        req.body.category,
        Number(req.body.ord || 0),
      ]
    );

    const rows = await query('SELECT * FROM brands WHERE id = ? LIMIT 1', [result.insertId]);
    res.status(201).json(mapBrand(rows[0]));
  } catch (err) { next(err); }
});

// ── Admin: update brand ───────────────────────────────────────────────────────
router.put('/:id', requireAuth, requireAdmin, upload.single('logo'), [
  param('id').isInt({ min: 1 }),
  body('name').optional().trim().isLength({ min: 1, max: 150 }),
  body('category').optional().isIn(['featured', 'ayurvedic', 'general', 'personal_care']),
  body('ord').optional().isInt({ min: 0 }).toInt(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const rows = await query('SELECT * FROM brands WHERE id = ? LIMIT 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Brand not found.' });
    const current = rows[0];

    let logoUrl = current.logo_url;

    if (req.body.removeLogo === 'true' || req.body.removeLogo === true) {
      if (logoUrl) { const pid = extractPublicId(logoUrl); if (pid) await deleteByPublicId(pid).catch(() => {}); }
      logoUrl = null;
    } else if (req.file) {
      if (logoUrl) { const pid = extractPublicId(logoUrl); if (pid) await deleteByPublicId(pid).catch(() => {}); }
      const { url } = await uploadBuffer(req.file.buffer, 'batla-medicos/brands');
      logoUrl = url;
    } else if (req.body.logoUrl && /^https?:\/\//i.test(String(req.body.logoUrl))) {
      logoUrl = String(req.body.logoUrl).trim();
    }

    const nextName = req.body.name !== undefined ? String(req.body.name).trim() : current.name;
    let nextSlug = current.slug;
    if (nextName !== current.name) {
      const slugBase = slugify(nextName);
      nextSlug = slugBase;
      let suffix = 2;
      while ((await query('SELECT id FROM brands WHERE slug = ? AND id <> ? LIMIT 1', [nextSlug, req.params.id])).length) {
        nextSlug = `${slugBase}-${suffix}`;
        suffix += 1;
      }
    }

    await execute(
      `UPDATE brands SET name = ?, slug = ?, logo_url = ?, gradient = ?, category = ?, ord = ?, is_active = ? WHERE id = ?`,
      [
        nextName,
        nextSlug,
        logoUrl,
        req.body.gradient !== undefined ? String(req.body.gradient).trim() : (current.gradient || ''),
        req.body.category !== undefined ? req.body.category : current.category,
        req.body.ord !== undefined ? Number(req.body.ord) : current.ord,
        req.body.isActive !== undefined ? (req.body.isActive === 'true' || req.body.isActive === true ? 1 : 0) : current.is_active,
        req.params.id,
      ]
    );

    const updated = await query('SELECT * FROM brands WHERE id = ? LIMIT 1', [req.params.id]);
    res.json(mapBrand(updated[0]));
  } catch (err) { next(err); }
});

// ── Admin: delete brand ───────────────────────────────────────────────────────
router.delete('/:id', requireAuth, requireAdmin, [param('id').isInt({ min: 1 })], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const rows = await query('SELECT * FROM brands WHERE id = ? LIMIT 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Brand not found.' });

    const logoUrl = rows[0].logo_url;
    if (logoUrl) { const pid = extractPublicId(logoUrl); if (pid) await deleteByPublicId(pid).catch(() => {}); }

    await execute('DELETE FROM brands WHERE id = ?', [req.params.id]);
    res.json({ message: 'Brand deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
