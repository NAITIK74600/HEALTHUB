const express = require('express');
const { body, query: queryValidator, param, validationResult } = require('express-validator');
const XLSX = require('xlsx');
const slugify = require('../utils/slugify');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const auditLogger = require('../middleware/auditLogger');
const upload = require('../middleware/upload');
const { uploadBuffer, deleteByPublicId } = require('../utils/cloudinary');
const { query, execute } = require('../db/mysql');

const router = express.Router();

const SLUG_ALIASES = {
  alopathic: 'allopathic',
  ayuveidc: 'ayurvedic',
  ayurvedc: 'ayurvedic',
  ayurvedik: 'ayurvedic',
  cosmetic: 'cosmetics',
  baby: 'baby-products',
  keimed: 'generic',
  'keimed-generics': 'generic',
};

// ── Virtual parent-group slugs (used in CategoryNav) ────────────────────────
// Maps a URL ?category= slug → array of real DB category slugs
const PARENT_GROUPS = {
  // ── CategoryNav top-level groups ─────────────────────────────────────────
  // Health Resource Center
  allopathic:           ['allopathic', 'caps-tabs', 'liquids', 'cream-ointment', 'drop', 'powder',
                         'injection', 'inhaler', 'softgel-capsules', 'fluids', 'high-value',
                         'generic', 'fridge', 'vaccines', 'dental', 'otc'],
  // Hair Care group
  'hair-care':          ['lotion', 'fmcg', 'cream-ointment', 'caps-tabs'],
  // Fitness & Health group
  'fitness-health':     ['caps-tabs', 'softgel-capsules', 'powder', 'liquids'],
  // Sexual Wellness group
  'sexual-wellness':    ['fmcg', 'caps-tabs'],
  // Vitamins & Nutrition group
  'vitamins-nutrition': ['caps-tabs', 'softgel-capsules', 'powder', 'liquids', 'drop', 'nutrition'],
  // Supports & Braces group
  'supports-braces':    ['surgicals', 'container', 'pharma-misc'],
  // Immunity Boosters group
  'immunity-boosters':  ['caps-tabs', 'liquids', 'powder', 'drop'],
  // Homeopathy group
  homeopathy:           ['homeopathy', 'drop', 'liquids', 'caps-tabs', 'powder'],
  // Ayurveda group
  ayurveda:             ['ayurvedic', 'herbal', 'caps-tabs', 'liquids', 'lotion', 'powder', 'cream-ointment'],
  // Skin Care group
  'skin-care':          ['cream-ointment', 'lotion', 'fmcg'],
  // Baby Care group
  'baby-care':          ['drop', 'powder', 'lotion', 'nutrition'],
  // Diabetes Care group
  'diabetes-care':      ['caps-tabs', 'injection', 'surgicals', 'drop', 'fluids'],

  // ── Legacy / alias parent slugs ─────────────────────────────────────────
  ayurvedic:            ['ayurvedic', 'herbal'],
  cosmetics:            ['cream-ointment', 'lotion', 'fmcg'],
  'baby-products':      ['nutrition', 'drop', 'lotion', 'powder'],
  surgical:             ['surgicals', 'container', 'pharma-misc'],
  surgicals:            ['surgicals', 'container', 'pharma-misc'],
  herbal:               ['herbal', 'ayurvedic'],
};

function normalizeCategorySlug(input = '') {
  const raw = String(input).trim().toLowerCase();
  return SLUG_ALIASES[raw] || raw;
}

function extractPublicId(url) {
  const match = String(url || '').match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w{2,5})?$/);
  return match ? match[1] : null;
}

function parseImages(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function mapProduct(row) {
  return {
    _id: String(row.id),
    code: row.code || '',
    name: row.name,
    slug: row.slug,
    category: row.category_id ? {
      _id: String(row.category_id),
      name: row.category_name,
      slug: row.category_slug,
    } : null,
    brand: row.brand || '',
    description: row.description || '',
    pack: row.pack || '',
    mrp: Number(row.mrp || 0),
    price: Number(row.price || 0),
    stock: Number(row.stock || 0),
    requiresPrescription: Boolean(row.requires_prescription),
    images: parseImages(row.images_json),
    expiryDate: row.expiry_date,
    batchNumber: row.batch_number || '',
    salt: row.salt || '',
    sideEffects: row.side_effects || '',
    isActive: Boolean(row.is_active),
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveCategoryIds(categoryParam) {
  if (!categoryParam) return null; // null = no filter (show all)
  const raw = String(categoryParam).trim();
  if (!raw) return null;

  // Numeric ID — direct lookup
  if (/^\d+$/.test(raw)) {
    const rows = await query('SELECT id FROM categories WHERE id = ? AND is_deleted = 0 LIMIT 1', [Number(raw)]);
    return rows.length ? [Number(raw)] : []; // [] = empty/invalid → 0 results
  }

  const slug = normalizeCategorySlug(raw);
  const group = PARENT_GROUPS[slug] || [slug];
  const rows = await query(
    `SELECT id FROM categories WHERE is_deleted = 0 AND slug IN (${group.map(() => '?').join(', ')})`,
    group
  );
  // If slug matched a group but none of the sub-slugs are seeded yet, return null (show all)
  // rather than [] which would return 0 products
  if (!rows.length) return null;
  return rows.map((row) => Number(row.id));
}

function buildProductWhere({ admin = false, params = {}, categoryIds = [] } = {}) {
  const where = [];
  const values = [];

  where.push('p.is_deleted = 0');
  if (!admin) where.push('p.is_active = 1');

  if (categoryIds.length) {
    where.push(`p.category_id IN (${categoryIds.map(() => '?').join(', ')})`);
    values.push(...categoryIds);
  }

  if (params.requiresPrescription !== undefined) {
    where.push('p.requires_prescription = ?');
    values.push(params.requiresPrescription ? 1 : 0);
  }

  if (params.brand) {
    where.push('p.brand LIKE ?');
    values.push(`%${params.brand}%`);
  }

  if (params.search) {
    where.push('(p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ? OR p.salt LIKE ?)');
    values.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`, `%${params.search}%`);
  }

  if (admin) {
    if (params.status === 'active') where.push('p.is_active = 1');
    if (params.status === 'inactive') where.push('p.is_active = 0');
    if (params.stockFilter === 'out') where.push('p.stock = 0');
    if (params.stockFilter === 'in') where.push('p.stock > 10');
    if (params.stockFilter === 'low') where.push('p.stock > 0 AND p.stock <= 10');
    if (params.discountFilter === 'none') where.push('p.price >= p.mrp');
    if (params.discountFilter === 'low') where.push('p.price < p.mrp AND p.price >= (p.mrp * 0.8)');
    if (params.discountFilter === 'mid') where.push('p.price < (p.mrp * 0.8) AND p.price >= (p.mrp * 0.5)');
    if (params.discountFilter === 'high') where.push('p.price < (p.mrp * 0.5)');
    if (params.missingInfo === '1') where.push("(COALESCE(p.salt, '') = '' OR COALESCE(p.description, '') = '')");
  }

  return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', values };
}

function sortSql(sort, admin = false) {
  const publicSort = {
    price_asc: 'p.price ASC',
    price_desc: 'p.price DESC',
    name_asc: 'p.name ASC',
    name_desc: 'p.name DESC',
    newest: 'p.created_at DESC',
  };
  const adminSort = {
    newest: 'p.created_at DESC',
    name_asc: 'p.name ASC',
    name_desc: 'p.name DESC',
    stock_asc: 'p.stock ASC',
    stock_desc: 'p.stock DESC',
    price_asc: 'p.price ASC',
    price_desc: 'p.price DESC',
  };
  const map = admin ? adminSort : publicSort;
  return map[sort] || 'p.created_at DESC';
}

async function fetchProducts({ whereSql, values, sort, limit, offset }) {
  const rows = await query(
    `SELECT p.*, c.id AS category_id, c.name AS category_name, c.slug AS category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ${whereSql}
     ORDER BY ${sort}
     LIMIT ? OFFSET ?`,
    [...values, Number(limit), Number(offset)]
  );
  return rows.map(mapProduct);
}

router.get('/', [
  queryValidator('page').optional().isInt({ min: 1 }).toInt(),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  queryValidator('category').optional().trim().isLength({ min: 1, max: 120 }),
  queryValidator('search').optional().trim().isLength({ max: 100 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const categoryIds = await resolveCategoryIds(req.query.category);
    // [] means a specific numeric ID was requested but not found → 0 results
    if (Array.isArray(categoryIds) && !categoryIds.length) {
      return res.json({ products: [], total: 0, page, pages: 0 });
    }
    // null means unknown slug with no DB match → show all products (graceful fallback)

    const { whereSql, values } = buildProductWhere({ params: req.query, categoryIds: categoryIds || [] });
    const [products, totalRows] = await Promise.all([
      fetchProducts({ whereSql, values, sort: sortSql(req.query.sort), limit, offset: (page - 1) * limit }),
      query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, values),
    ]);

    const total = Number(totalRows[0]?.total || 0);
    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

router.get('/brands', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT brand, COUNT(*) AS count
       FROM products
       WHERE is_deleted = 0 AND is_active = 1 AND COALESCE(brand, '') <> ''
       GROUP BY brand
       ORDER BY count DESC, brand ASC
       LIMIT 50`,
      []
    );
    res.json({ brands: rows.map((row) => ({ brand: row.brand, count: Number(row.count || 0) })) });
  } catch (err) { next(err); }
});

router.get('/admin/list', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const categoryIds = await resolveCategoryIds(req.query.category);
    if (Array.isArray(categoryIds) && !categoryIds.length) {
      return res.json({ products: [], total: 0, page, pages: 0 });
    }

    const { whereSql, values } = buildProductWhere({ admin: true, params: req.query, categoryIds: categoryIds || [] });
    const [products, totalRows] = await Promise.all([
      fetchProducts({ whereSql, values, sort: sortSql(req.query.sort, true), limit, offset: (page - 1) * limit }),
      query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, values),
    ]);

    const total = Number(totalRows[0]?.total || 0);
    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

router.get('/import-template', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const categories = await query('SELECT slug, name FROM categories WHERE is_deleted = 0 ORDER BY ord ASC, name ASC', []);
    const wb = XLSX.utils.book_new();
    const wsProducts = XLSX.utils.aoa_to_sheet([
      ['name', 'brand', 'salt', 'description', 'side_effects', 'category', 'mrp', 'price', 'stock', 'requiresPrescription', 'code', 'pack', 'batchNumber'],
      ['Paracetamol 650 Tablet', 'Cipla', 'Paracetamol 650mg', 'Fever, headache, and mild pain relief.', 'Nausea, rash (rare)', 'caps-tabs', 35, 30, 120, 'false', 'PARA650-01', '10 tablets strip', 'BATCH-2026-01'],
    ]);
    const wsCategories = XLSX.utils.aoa_to_sheet([['slug', 'name'], ...categories.map((row) => [row.slug, row.name])]);
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');
    XLSX.utils.book_append_sheet(wb, wsCategories, 'Categories');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="products-template.xlsx"');
    res.send(buf);
  } catch (err) { next(err); }
});

router.get('/csv-template', requireAuth, requireAdmin, (req, res) => {
  const header = 'name,brand,salt,description,side_effects,category,mrp,price,stock,requiresPrescription,code,pack,batchNumber';
  const example = '"Paracetamol 650 Tablet","Cipla","Paracetamol 650mg","Fever and pain relief","Nausea (rare)","caps-tabs",35,30,120,false,"PARA650-01","10 tablets strip","BATCH-2026-01"';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="products-template.csv"');
  res.send(`${header}\n${example}\n`);
});

router.get('/export-excel', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT p.*, c.slug AS category_slug, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.is_deleted = 0
       ORDER BY p.created_at DESC`,
      []
    );

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows.map((row) => ({
      name: row.name,
      brand: row.brand || '',
      salt: row.salt || '',
      description: row.description || '',
      side_effects: row.side_effects || '',
      category: row.category_slug || '',
      mrp: Number(row.mrp || 0),
      price: Number(row.price || 0),
      stock: Number(row.stock || 0),
      requiresPrescription: Boolean(row.requires_prescription),
      code: row.code || '',
      pack: row.pack || '',
      batchNumber: row.batch_number || '',
      isActive: Boolean(row.is_active),
      slug: row.slug,
    })));
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="products-export-${Date.now()}.xlsx"`);
    res.send(buf);
  } catch (err) { next(err); }
});

router.get('/missing-info/count', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const rows = await query(
      "SELECT COUNT(*) AS total FROM products WHERE is_deleted = 0 AND (COALESCE(salt, '') = '' OR COALESCE(description, '') = '')",
      []
    );
    res.json({ count: Number(rows[0]?.total || 0) });
  } catch (err) { next(err); }
});

router.post('/request-availability', [
  body('medicineName').trim().isLength({ min: 2, max: 180 }),
  body('customerName').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 25 }),
  body('email').optional({ values: 'falsy' }).trim().isEmail().isLength({ max: 190 }),
  body('searchQuery').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    await execute(
      `INSERT INTO availability_requests
        (medicine_name, customer_name, phone, email, search_query, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [
        String(req.body.medicineName || '').trim(),
        String(req.body.customerName || '').trim(),
        String(req.body.phone || '').trim(),
        String(req.body.email || '').trim().toLowerCase(),
        String(req.body.searchQuery || '').trim(),
      ]
    );

    res.status(201).json({
      message: 'Request received. Batla Medicos will contact you if medicine becomes available.',
    });
  } catch (err) { next(err); }
});

// ── Bulk import via CSV/Excel upload ────────────────────────────────────────
const { uploadSpreadsheet } = require('../middleware/upload');
const { parse: parseCsv } = require('csv-parse/sync');

// Column name normaliser (strips non-alphanumeric for fuzzy matching)
function _headKey(v) { return String(v ?? '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

// Find index of first header that matches any alias
function _col(headers, ...aliases) {
  const keys = headers.map(_headKey);
  for (const a of aliases) {
    const i = keys.indexOf(a);
    if (i >= 0) return i;
  }
  return -1;
}

// CSV type → category slug
const _TYPE_SLUG = {
  allopathy: 'caps-tabs', allopathic: 'caps-tabs',
  ayurvedic: 'ayurvedic', ayurveda: 'ayurvedic',
  homeopathy: 'caps-tabs',
  unani: 'herbal', siddha: 'herbal',
  surgical: 'surgicals', otc: 'otc',
  cosmetic: 'cosmetics', cosmetics: 'cosmetics',
  nutritional: 'nutrition', nutrition: 'nutrition',
  dental: 'dental', baby: 'baby-products', vaccine: 'vaccines',
};

router.post(
  '/bulk-import',
  requireAuth, requireAdmin,
  uploadSpreadsheet.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

      const ext = (req.file.originalname || '').split('.').pop().toLowerCase();
      const mode = req.body.mode === 'replace' ? 'replace' : 'append'; // default: append

      // ── Parse file buffer → array of row objects ────────────────────────
      let rows = [];
      if (ext === 'csv') {
        rows = parseCsv(req.file.buffer, {
          columns: true, skip_empty_lines: true,
          relax_quotes: true, trim: true,
        });
      } else {
        // xlsx / xls
        const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      }

      if (!rows.length) return res.status(400).json({ message: 'File is empty or could not be parsed.' });

      // ── Detect columns (supports both CSV schema & Excel schema) ─────────
      const headers = Object.keys(rows[0]);
      const C = {
        name:   _col(headers, 'name', 'itemname', 'item', 'productname', 'medicine', 'medicinename'),
        price:  _col(headers, 'price', 'mrp', 'rate', 'saleprice'),
        brand:  _col(headers, 'manufacturername', 'manufacturer', 'brand', 'company'),
        pack:   _col(headers, 'packsizelabel', 'pack', 'packing', 'unit'),
        salt:   _col(headers, 'saltcomposition', 'salt', 'composition', 'shortcomposition1'),
        desc:   _col(headers, 'medicinedesc', 'description', 'desc'),
        se:     _col(headers, 'sideeffects', 'sideeffect'),
        disc:   _col(headers, 'isdiscontinued', 'discontinued', 'isactive'),
        type:   _col(headers, 'type', 'itemcategory', 'category'),
        stock:  _col(headers, 'stock', 'qty', 'quantity'),
        code:   _col(headers, 'code', 'barcode', 'itemcode'),
      };

      if (C.name < 0) return res.status(400).json({ message: 'Could not find a "name" column in the uploaded file.' });

      // Helper to get a cell value by column index
      const cell = (row, idx) => idx >= 0 ? String(row[headers[idx]] ?? '').trim() : '';

      // ── Load category map (slug → id) ───────────────────────────────────
      const catRows = await query('SELECT id, slug FROM categories WHERE is_deleted = 0');
      const catMap = {};
      for (const r of catRows) catMap[r.slug] = r.id;
      const fallbackCatId = catMap['caps-tabs'] || catRows[0]?.id;

      // ── REPLACE mode: delete existing products ──────────────────────────
      if (mode === 'replace') {
        await execute('DELETE FROM products');
      }

      // ── Insert in batches of 500 ────────────────────────────────────────
      const BATCH = 500;
      let inserted = 0, skipped = 0;

      function makeSlug(name, idx) {
        const base = name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-')
          .replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 200);
        return `${base}-${idx}`;
      }

      for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH);
        const values = [];

        for (let j = 0; j < chunk.length; j++) {
          const row = chunk[j];
          const rowIdx = i + j + 1;

          const name = cell(row, C.name).substring(0, 200);
          if (!name) { skipped++; continue; }

          const priceRaw = parseFloat(cell(row, C.price)) || 0;
          const discRaw  = cell(row, C.disc).toLowerCase();
          const isActive = (discRaw === 'true' || discRaw === '1') ? 0 : 1;
          const typeSlug = _TYPE_SLUG[cell(row, C.type).toLowerCase()] || 'caps-tabs';
          const catId    = catMap[typeSlug] || fallbackCatId;
          if (!catId) { skipped++; continue; }

          values.push([
            cell(row, C.code).substring(0, 50),
            name,
            makeSlug(name, rowIdx),
            catId,
            cell(row, C.brand).substring(0, 100),
            cell(row, C.desc) || null,
            cell(row, C.pack).substring(0, 100),
            priceRaw,   // mrp
            priceRaw,   // price
            parseInt(cell(row, C.stock)) || 0,
            0,          // requires_prescription
            null,       // images_json
            null,       // expiry_date
            '',         // batch_number
            cell(row, C.salt).substring(0, 500),
            cell(row, C.se).substring(0, 1000),
            isActive,
            0,          // is_deleted
          ]);
        }

        if (values.length) {
          await query(
            `INSERT IGNORE INTO products
              (code,name,slug,category_id,brand,description,pack,
               mrp,price,stock,requires_prescription,images_json,
               expiry_date,batch_number,salt,side_effects,is_active,is_deleted)
             VALUES ?`,
            [values]
          );
          inserted += values.length;
        }
      }

      res.json({ mode, inserted, skipped, total: rows.length });
    } catch (err) { next(err); }
  }
);

router.post('/ai-fill', requireAuth, requireAdmin, async (req, res) => {
  res.status(503).json({ message: 'AI fill is disabled in MySQL runtime.' });
});

router.post('/ai-fill-bulk', requireAuth, requireAdmin, async (req, res) => {
  res.status(503).json({ message: 'AI bulk fill is disabled in MySQL runtime.' });
});

router.get('/ai-test-models', requireAuth, requireAdmin, async (req, res) => {
  res.status(503).json({ message: 'AI model testing is disabled in MySQL runtime.' });
});

router.get('/:slug', [param('slug').trim().isLength({ min: 1, max: 220 })], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const rows = await query(
      `SELECT p.*, c.id AS category_id, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.is_deleted = 0 AND p.is_active = 1 LIMIT 1`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ message: 'Product not found.' });
    res.json(mapProduct(rows[0]));
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireAdmin, upload.array('images', 5), auditLogger('CREATE_PRODUCT', 'Product'), [
  body('name').trim().notEmpty().isLength({ max: 200 }),
  body('category').isInt({ min: 1 }),
  body('brand').optional().trim().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('salt').optional().trim().isLength({ max: 500 }),
  body('mrp').isFloat({ min: 0 }),
  body('price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const slugBase = slugify(req.body.name);
    let slug = slugBase;
    let suffix = 2;
    while ((await query('SELECT id FROM products WHERE slug = ? LIMIT 1', [slug])).length) {
      slug = `${slugBase}-${suffix}`;
      suffix += 1;
    }

    const imageUrls = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const { url } = await uploadBuffer(file.buffer, 'batla-medicos/products');
        imageUrls.push(url);
      }
    }

    const result = await execute(
      `INSERT INTO products
        (code, name, slug, category_id, brand, description, pack, mrp, price, stock, requires_prescription,
         images_json, expiry_date, batch_number, salt, side_effects, is_active, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
      [
        req.body.code || '',
        req.body.name.trim(),
        slug,
        Number(req.body.category),
        req.body.brand || '',
        req.body.description || '',
        req.body.pack || '',
        Number(req.body.mrp),
        Number(req.body.price),
        Number(req.body.stock),
        req.body.requiresPrescription === true || req.body.requiresPrescription === 'true' ? 1 : 0,
        JSON.stringify(imageUrls),
        req.body.expiryDate || null,
        req.body.batchNumber || '',
        req.body.salt || '',
        req.body.sideEffects || '',
      ]
    );

    const rows = await query(
      `SELECT p.*, c.id AS category_id, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? LIMIT 1`,
      [result.insertId]
    );
    res.status(201).json(mapProduct(rows[0]));
  } catch (err) { next(err); }
});

router.put('/:id', requireAuth, requireAdmin, upload.array('images', 5), [param('id').isInt({ min: 1 })], auditLogger('UPDATE_PRODUCT', 'Product'), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const rows = await query('SELECT * FROM products WHERE id = ? AND is_deleted = 0 LIMIT 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found.' });

    const current = rows[0];
    req._auditBefore = mapProduct({ ...current, category_name: null, category_slug: null });
    let images = parseImages(current.images_json);

    if (req.body.removeImages) {
      let toRemove = [];
      try { toRemove = JSON.parse(req.body.removeImages); } catch {}
      if (Array.isArray(toRemove) && toRemove.length) {
        for (const imageUrl of toRemove) {
          const publicId = extractPublicId(imageUrl);
          if (publicId) await deleteByPublicId(publicId).catch(() => {});
        }
        images = images.filter((imageUrl) => !toRemove.includes(imageUrl));
      }
    }

    if (req.files?.length) {
      for (const file of req.files) {
        const { url } = await uploadBuffer(file.buffer, 'batla-medicos/products');
        images.push(url);
      }
    }

    if (req.body.imageUrl && /^https?:\/\//i.test(String(req.body.imageUrl).trim())) {
      images.push(String(req.body.imageUrl).trim());
    }

    const nextName = req.body.name !== undefined ? String(req.body.name).trim() : current.name;
    let nextSlug = current.slug;
    if (nextName !== current.name) {
      const slugBase = slugify(nextName);
      nextSlug = slugBase;
      let suffix = 2;
      while ((await query('SELECT id FROM products WHERE slug = ? AND id <> ? LIMIT 1', [nextSlug, req.params.id])).length) {
        nextSlug = `${slugBase}-${suffix}`;
        suffix += 1;
      }
    }

    await execute(
      `UPDATE products SET
        code = ?, name = ?, slug = ?, category_id = ?, brand = ?, description = ?, pack = ?,
        mrp = ?, price = ?, stock = ?, requires_prescription = ?, images_json = ?, expiry_date = ?,
        batch_number = ?, salt = ?, side_effects = ?, is_active = ?
       WHERE id = ?`,
      [
        req.body.code !== undefined ? req.body.code : current.code,
        nextName,
        nextSlug,
        req.body.category !== undefined ? Number(req.body.category) : current.category_id,
        req.body.brand !== undefined ? req.body.brand : current.brand,
        req.body.description !== undefined ? req.body.description : current.description,
        req.body.pack !== undefined ? req.body.pack : current.pack,
        req.body.mrp !== undefined ? Number(req.body.mrp) : Number(current.mrp),
        req.body.price !== undefined ? Number(req.body.price) : Number(current.price),
        req.body.stock !== undefined ? Number(req.body.stock) : Number(current.stock),
        req.body.requiresPrescription !== undefined
          ? (req.body.requiresPrescription === true || req.body.requiresPrescription === 'true' ? 1 : 0)
          : current.requires_prescription,
        JSON.stringify(images),
        req.body.expiryDate !== undefined ? req.body.expiryDate || null : current.expiry_date,
        req.body.batchNumber !== undefined ? req.body.batchNumber : current.batch_number,
        req.body.salt !== undefined ? req.body.salt : current.salt,
        req.body.sideEffects !== undefined ? req.body.sideEffects : current.side_effects,
        req.body.isActive !== undefined ? (req.body.isActive === true || req.body.isActive === 'true' ? 1 : 0) : current.is_active,
        req.params.id,
      ]
    );

    const updated = await query(
      `SELECT p.*, c.id AS category_id, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? LIMIT 1`,
      [req.params.id]
    );
    res.json(mapProduct(updated[0]));
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, requireAdmin, [param('id').isInt({ min: 1 })], auditLogger('DELETE_PRODUCT', 'Product'), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const rows = await query('SELECT * FROM products WHERE id = ? AND is_deleted = 0 LIMIT 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found.' });

    req._auditBefore = mapProduct({ ...rows[0], category_name: null, category_slug: null });
    await execute('UPDATE products SET is_deleted = 1, is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted.' });
  } catch (err) { next(err); }
});

router.patch('/:id/quick-update', requireAuth, requireAdmin, [param('id').isInt({ min: 1 })], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const rows = await query('SELECT * FROM products WHERE id = ? AND is_deleted = 0 LIMIT 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found.' });
    const current = rows[0];

    await execute('UPDATE products SET stock = ?, is_active = ? WHERE id = ?', [
      req.body.stock !== undefined ? Math.max(0, parseInt(req.body.stock, 10)) : current.stock,
      req.body.isActive !== undefined ? (req.body.isActive ? 1 : 0) : current.is_active,
      req.params.id,
    ]);

    const updated = await query(
      `SELECT p.*, c.id AS category_id, c.name AS category_name, c.slug AS category_slug
       FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ? LIMIT 1`,
      [req.params.id]
    );
    res.json(mapProduct(updated[0]));
  } catch (err) { next(err); }
});

router.patch('/bulk-update', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { ids, update = {}, applyToAll = false, filterParams = {} } = req.body;
    let targetIds = [];

    if (applyToAll) {
      const categoryIds = await resolveCategoryIds(filterParams.category);
      const { whereSql, values } = buildProductWhere({ admin: true, params: filterParams, categoryIds });
      const rows = await query(`SELECT p.id FROM products p ${whereSql}`, values);
      targetIds = rows.map((row) => row.id);
    } else {
      targetIds = Array.isArray(ids) ? ids.map((id) => Number(id)).filter(Boolean) : [];
    }

    if (!targetIds.length) return res.json({ message: 'Bulk update complete.', modified: 0 });

    const setParts = [];
    const values = [];

    if (update.stock !== undefined) {
      setParts.push('stock = ?');
      values.push(Math.max(0, Number(update.stock)));
    }
    if (update.isActive !== undefined) {
      setParts.push('is_active = ?');
      values.push(update.isActive ? 1 : 0);
    }
    if (update.isDeleted !== undefined) {
      setParts.push('is_deleted = ?');
      values.push(update.isDeleted ? 1 : 0);
      if (update.isDeleted) {
        setParts.push('is_active = 0');
      }
    }
    if (!setParts.length) return res.status(400).json({ message: 'Nothing to update.' });

    const placeholders = targetIds.map(() => '?').join(', ');
    const result = await execute(`UPDATE products SET ${setParts.join(', ')} WHERE id IN (${placeholders})`, [...values, ...targetIds]);
    res.json({ message: 'Bulk update complete.', modified: result.affectedRows || 0 });
  } catch (err) { next(err); }
});

router.patch('/bulk-discount', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { ids, discountPct, applyToAll = false, filterParams = {} } = req.body;
    const pct = Number(discountPct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return res.status(422).json({ message: 'discountPct must be a number between 0 and 100.' });
    }

    let targetIds = [];
    if (applyToAll) {
      const categoryIds = await resolveCategoryIds(filterParams.category);
      const { whereSql, values } = buildProductWhere({ admin: true, params: filterParams, categoryIds });
      const rows = await query(`SELECT p.id FROM products p ${whereSql}`, values);
      targetIds = rows.map((row) => row.id);
    } else {
      targetIds = Array.isArray(ids) ? ids.map((id) => Number(id)).filter(Boolean) : [];
    }

    if (!targetIds.length) return res.json({ message: 'Discount applied. 0 products updated.', modified: 0 });
    const placeholders = targetIds.map(() => '?').join(', ');
    const multiplier = ((100 - pct) / 100).toFixed(6);
    const result = await execute(
      `UPDATE products SET price = ROUND(mrp * ?, 2) WHERE id IN (${placeholders})`,
      [multiplier, ...targetIds]
    );
    res.json({ message: `Discount applied. ${result.affectedRows || 0} products updated.`, modified: result.affectedRows || 0 });
  } catch (err) { next(err); }
});

module.exports = router;