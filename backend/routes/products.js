const express = require('express');
const { body, query: queryValidator, param, validationResult } = require('express-validator');
const XLSX = require('xlsx');
const slugify = require('../utils/slugify');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const auditLogger = require('../middleware/auditLogger');
const { query, execute } = require('../db/mysql');
const { geminiAutoFill } = require('../utils/gemini');

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

// Lifestyle slugs — products carry an indexed lifestyle_category column set at import time.
// Querying by this column is fast (single indexed equality) vs. N×LIKE scans.
const LIFESTYLE_SLUGS = new Set([
  'sexual-wellness', 'skin-care', 'hair-care', 'baby-care',
  'fitness-health', 'vitamins-nutrition', 'diabetes-care', 'supports-braces',
  'immunity-boosters',
]);

// SQL fallback for when lifestyle_category IS NULL (column not yet populated by classifyProducts.js).
// Once the column is populated the fast indexed equality path handles those rows.
// All patterns use LOWER() for case-insensitive matching on MySQL 5.7.
const LIFESTYLE_FALLBACK_SQL = {
  'sexual-wellness':
    `(LOWER(p.name) REGEXP 'condom|sildenafil|tadalafil|dapoxetine|contraceptive|ipill|unwanted|mifepristone|levonorgestrel|lubricant gel|vaginal|kamagra|vigora|suhagra|caverta|erectile|spermicide'
     OR LOWER(p.brand) REGEXP 'manforce|moods|skore|notyet|playgard|durex'
     OR LOWER(p.salt)  REGEXP 'sildenafil|tadalafil|dapoxetine|vardenafil|avanafil|levonorgestrel|mifepristone')`,

  'baby-care':
    `(LOWER(p.name) REGEXP 'baby oil|baby powder|baby shampoo|baby lotion|baby cream|baby soap|baby wipe|baby diaper|gripe water|lactogen|nan pro|similac|pediasure|cerelac|enfamil|aptamil|feeding bottle|breast pump|pacifier|teether|baby rash'
     OR LOWER(p.brand) REGEXP 'johnsonbaby|johnson baby|himalaya baby|mother sparsh|mamy poko|huggies|pampers|pigeon|dr.brown')`,

  'skin-care':
    `(LOWER(p.name) REGEXP 'sunscreen|sun screen|spf [0-9]|face wash|facewash|face scrub|face pack|face mask|face serum|face gel|face toner|face cream|moisturizer|moisturiser|anti aging|anti-aging|anti ageing|wrinkle|dark spot|pigmentation|skin whitening|skin brightening|fairness cream|fairness lotion|retinol|niacinamide|hyaluronic acid|kojic|salicylic acid gel|benzoyl peroxide|acne gel|pimple gel|under eye gel'
     OR LOWER(p.brand) REGEXP 'cetaphil|lacto calamine|neutrogena|olay|loreal revitalift|clean.and.clear|himalaya face|mamaearth face|plum face|wow face|biotique face|minimalist|re-equil|dot.and.key|pilgrim')`,

  'hair-care':
    `(LOWER(p.name) REGEXP 'shampoo|conditioner|hair serum|hair mask|hair spray|hair cream|hair tonic|anti dandruff|anti-dandruff|hairfall|hair fall|hair loss|hair growth serum|hair oil|amla oil|argan oil|bhringraj|onion hair|onion shampoo|scalp serum|hair color|hair colour'
     OR LOWER(p.brand) REGEXP 'tresemme|pantene|head.and.shoulder|dove shampoo|clinic plus|himalaya hair|mamaearth hair|wow hair|biotique hair|indulekha|kesh king|parachute|livon'
     OR LOWER(p.salt)  REGEXP 'minoxidil|finasteride|ketoconazole|zinc pyrithione|selenium sulfide')`,

  'diabetes-care':
    `(LOWER(p.name) REGEXP 'glucometer|glucose meter|glucose monitor|lancet|blood glucose|accu.chek|contour plus|onetouch|freestyle libre|sugar free|sugar-free|diabetic sock|insulin pen|insulin syringe|insulin needle|glucose strip'
     OR LOWER(p.salt)  REGEXP 'metformin|glipizide|glibenclamide|gliclazide|glimepiride|voglibose|sitagliptin|empagliflozin|dapagliflozin|canagliflozin|saxagliptin|linagliptin|alogliptin|insulin glargine|insulin degludec|insulin aspart|insulin lispro|insulin detemir|liraglutide|dulaglutide|semaglutide')`,

  'vitamins-nutrition':
    `(LOWER(p.name) REGEXP 'multivitamin|multi-vitamin|vitamin b12 tab|vitamin b12 cap|vitamin c tab|vitamin c chew|vitamin d3 tab|vitamin d3 cap|calcium tab|iron tab|folic acid tab|biotin tab|zinc tab|omega 3 cap|omega-3 cap|whey protein|protein powder|mass gainer|casein protein|bcaa|creatine mono'
     OR LOWER(p.brand) REGEXP 'revital|supradyn|centrum|limcee|becosules|neurobion|complan|horlicks|bournvita|ensure|protinex|boost|healthkart|muscleblaze|optimum nutrition|gnc|now foods|fast.and.up|myprotein'
     OR LOWER(p.name)  REGEXP 'complan|horlicks|bournvita|ensure powder|protinex powder')`,

  'fitness-health':
    `(LOWER(p.name) REGEXP 'pre workout|pre-workout|post workout|energy booster cap|stamina booster cap|fat burner cap|weight loss cap|slimming cap|testosterone booster|ashwagandha cap|ashwagandha tab|shilajit cap|shilajit resin|tribulus cap|safed musli|kaunch|shatavari cap|chyawanprash|giloy juice|giloy tab|amla juice|neem tab|moringa cap|spirulina tab|turmeric cap|curcumin cap')`,

  'supports-braces':
    `(LOWER(p.name) REGEXP 'knee cap|knee brace|knee support|ankle brace|ankle support|wrist brace|wrist support|elbow brace|elbow support|lumbar support|back support|cervical collar|cervical support|shoulder brace|shoulder support|compression stocking|compression bandage|crepe bandage|abdominal belt|surgical belt|hernia belt|maternity belt|splint|walker frame|crutch|wheelchair|nebulizer|pulse oximeter|bp monitor|blood pressure monitor')`,

  'immunity-boosters':
    `(LOWER(p.name) REGEXP 'chyawanprash|chyavanprash|immunity booster|immune booster|immune support|immunoboost|giloy syrup|giloy juice|giloy tab|tulsi syrup|amla juice|elderberry|echinacea|zinc immunity|vitamin c immunity'
     OR LOWER(p.brand) REGEXP 'dabur chyawan|baidyanath|patanjali immunity|himalaya immuno')`,
};

function normalizeCategorySlug(input = '') {
  const raw = String(input).trim().toLowerCase();
  return SLUG_ALIASES[raw] || raw;
}

function isCloudinaryUrl(url) {
  return typeof url === 'string' && /(^|\/\/)res\.cloudinary\.com\b|cloudinary\.com\b/i.test(url);
}

function parseImages(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .filter((u) => typeof u === 'string')
      .map((u) => u.trim())
      .filter((u) => u && !isCloudinaryUrl(u));
  }
  if (typeof value === 'object') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed
          .filter((u) => typeof u === 'string')
          .map((u) => u.trim())
          .filter((u) => u && !isCloudinaryUrl(u))
      : [];
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
    company: row.company || '',
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

  if (params.lifestyleCategory) {
    // Use indexed column for already-classified rows; fall back to REGEXP for NULL rows
    // so the page works correctly even before classifyProducts.js has been run.
    const fallback = LIFESTYLE_FALLBACK_SQL[params.lifestyleCategory];
    if (fallback) {
      where.push(`(p.lifestyle_category = ? OR (p.lifestyle_category IS NULL AND ${fallback}))`);
    } else {
      where.push('p.lifestyle_category = ?');
    }
    values.push(params.lifestyleCategory);
  } else if (params.search) {
    where.push('(p.name LIKE ? OR p.brand LIKE ? OR p.company LIKE ? OR p.description LIKE ? OR p.salt LIKE ?)');
    values.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`, `%${params.search}%`, `%${params.search}%`);
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
    price_asc:    'p.price ASC',
    price_desc:   'p.price DESC',
    name_asc:     'p.name ASC',
    name_desc:    'p.name DESC',
    newest:       'p.created_at DESC',
    category_asc: 'c.name ASC, p.name ASC',
    category_desc:'c.name DESC, p.name ASC',
  };
  const adminSort = {
    newest:       'p.created_at DESC',
    name_asc:     'p.name ASC',
    name_desc:    'p.name DESC',
    stock_asc:    'p.stock ASC',
    stock_desc:   'p.stock DESC',
    price_asc:    'p.price ASC',
    price_desc:   'p.price DESC',
    category_asc: 'c.name ASC, p.name ASC',
    category_desc:'c.name DESC, p.name ASC',
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

    const catSlug = req.query.category ? normalizeCategorySlug(req.query.category) : null;
    const isLifestyle = catSlug ? LIFESTYLE_SLUGS.has(catSlug) : false;

    let categoryIds, lifestyleCategory;
    if (isLifestyle) {
      // Lifestyle category → fast indexed lookup on lifestyle_category column
      categoryIds     = null;
      lifestyleCategory = catSlug;
    } else {
      categoryIds = await resolveCategoryIds(req.query.category);
      if (Array.isArray(categoryIds) && !categoryIds.length) {
        return res.json({ products: [], total: 0, page, pages: 0 });
      }
    }

    const { whereSql, values } = buildProductWhere({
      params: { ...req.query, lifestyleCategory },
      categoryIds: categoryIds || [],
    });
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

    const catSlug = req.query.category ? normalizeCategorySlug(req.query.category) : null;
    const isLifestyle = catSlug ? LIFESTYLE_SLUGS.has(catSlug) : false;

    let categoryIds, lifestyleCategory;
    if (isLifestyle) {
      categoryIds     = null;
      lifestyleCategory = catSlug;
    } else {
      categoryIds = await resolveCategoryIds(req.query.category);
      if (Array.isArray(categoryIds) && !categoryIds.length) {
        return res.json({ products: [], total: 0, page, pages: 0 });
      }
    }

    const { whereSql, values } = buildProductWhere({
      admin: true,
      params: { ...req.query, lifestyleCategory },
      categoryIds: categoryIds || [],
    });
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
    // Column headers MUST match what the import column-detector expects
    const wsProducts = XLSX.utils.aoa_to_sheet([
      ['name', 'brand', 'salt', 'description', 'side_effects', 'category', 'mrp', 'price', 'stock', 'requiresPrescription', 'code', 'pack', 'batchNumber', 'isActive'],
      ['Paracetamol 650 Tablet', 'Cipla', 'Paracetamol 650mg', 'Fever, headache, and mild pain relief.', 'Nausea, rash (rare)', 'caps-tabs', 35, 30, 120, 'false', 'PARA650-01', '10 tablets strip', 'BATCH-2026-01', 'true'],
      ['Amoxicillin 500mg Capsule', 'Sun Pharma', 'Amoxicillin 500mg', 'Antibiotic for bacterial infections.', 'Diarrhoea, rash (rare)', 'caps-tabs', 95, 85, 50, 'true', 'AMOX500-01', '10 capsules strip', 'BATCH-2026-02', 'true'],
    ]);
    const wsCategories = XLSX.utils.aoa_to_sheet([['slug', 'name'], ...categories.map((row) => [row.slug, row.name])]);
    const wsGuide = XLSX.utils.aoa_to_sheet([
      ['Column', 'Required', 'Notes'],
      ['name', 'YES', 'Product name (max 200 chars)'],
      ['brand', 'no', 'Manufacturer / brand name'],
      ['salt', 'no', 'Active ingredient + strength'],
      ['description', 'no', 'One-line description'],
      ['side_effects', 'no', 'Known side effects'],
      ['category', 'no', 'Slug from the Categories sheet (e.g. caps-tabs, syrups, surgicals)'],
      ['mrp', 'no', 'Maximum Retail Price (numeric)'],
      ['price', 'no', 'Sale / discounted price (numeric, defaults to mrp if blank)'],
      ['stock', 'no', 'Stock quantity (numeric, default 0)'],
      ['requiresPrescription', 'no', 'true or false'],
      ['code', 'no', 'Product barcode / SKU'],
      ['pack', 'no', 'Pack size label (e.g. 10 tablets strip)'],
      ['batchNumber', 'no', 'Batch / lot number'],
      ['isActive', 'no', 'true = visible on site, false = hidden (default true)'],
    ]);
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');
    XLSX.utils.book_append_sheet(wb, wsCategories, 'Categories');
    XLSX.utils.book_append_sheet(wb, wsGuide, 'Guide');
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

// Export as CSV — much lighter than xlsx for large catalogs (250k+ products)
// Supports optional filters: ?search=&category=&brand=&status=&stockFilter=
router.get('/export-excel', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const categoryIds = await resolveCategoryIds(req.query.category);
    const { whereSql, values } = buildProductWhere({
      admin: true,
      params: req.query,
      categoryIds: categoryIds || [],
    });

    const rows = await query(
      `SELECT p.id, p.name, p.brand, p.salt, p.description, p.side_effects,
              c.slug AS category_slug, p.mrp, p.price, p.stock,
              p.requires_prescription, p.code, p.pack, p.batch_number,
              p.is_active, p.slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql}
       ORDER BY p.created_at DESC
       LIMIT 50000`,
      values
    );

    // Build CSV (no in-memory xlsx — safe for large datasets)
    const header = 'name,brand,salt,description,side_effects,category,mrp,price,stock,requiresPrescription,code,pack,batchNumber,isActive,slug';
    const escCsv = (v) => {
      const s = String(v ?? '');
      return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csvRows = rows.map((r) => [
      escCsv(r.name), escCsv(r.brand || ''), escCsv(r.salt || ''),
      escCsv(r.description || ''), escCsv(r.side_effects || ''),
      escCsv(r.category_slug || ''),
      r.mrp, r.price, r.stock,
      r.requires_prescription ? 'true' : 'false',
      escCsv(r.code || ''), escCsv(r.pack || ''), escCsv(r.batch_number || ''),
      r.is_active ? 'true' : 'false',
      escCsv(r.slug || ''),
    ].join(','));

    const csv = [header, ...csvRows].join('\n');
    const filename = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // UTF-8 BOM so Excel opens it correctly
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
        mrp:    _col(headers, 'mrp', 'maxretailprice', 'originalprice'),
        price:  _col(headers, 'price', 'saleprice', 'discountedprice', 'rate'),
        brand:  _col(headers, 'manufacturername', 'manufacturer', 'brand', 'company'),
        pack:   _col(headers, 'packsizelabel', 'pack', 'packing', 'unit'),
        salt:   _col(headers, 'saltcomposition', 'salt', 'composition', 'shortcomposition1'),
        desc:   _col(headers, 'medicinedesc', 'description', 'desc'),
        se:     _col(headers, 'sideeffects', 'sideeffect'),
        active: _col(headers, 'isactive', 'active', 'status'),
        disc:   _col(headers, 'isdiscontinued', 'discontinued'),
        type:   _col(headers, 'type', 'itemcategory', 'category'),
        stock:  _col(headers, 'stock', 'qty', 'quantity'),
        code:   _col(headers, 'code', 'barcode', 'itemcode'),
        rx:     _col(headers, 'requiresprescription', 'prescription', 'rx'),
        batch:  _col(headers, 'batchnumber', 'batch', 'lotnumber'),
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

          const mrpRaw   = parseFloat(cell(row, C.mrp))   || parseFloat(cell(row, C.price)) || 0;
          const priceRaw = parseFloat(cell(row, C.price)) || mrpRaw;
          // isActive: read from isActive/active column first, then invert isdiscontinued
          let isActive = 1;
          const activeRaw = cell(row, C.active).toLowerCase();
          const discRaw   = cell(row, C.disc).toLowerCase();
          if (activeRaw)       isActive = (activeRaw === 'true' || activeRaw === '1') ? 1 : 0;
          else if (discRaw)    isActive = (discRaw   === 'true' || discRaw   === '1') ? 0 : 1;
          const rxRaw    = cell(row, C.rx).toLowerCase();
          const requiresRx = (rxRaw === 'true' || rxRaw === '1') ? 1 : 0;
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
            mrpRaw,     // mrp
            priceRaw,   // sale price
            parseInt(cell(row, C.stock)) || 0,
            requiresRx, // requires_prescription
            null,       // images_json
            null,       // expiry_date
            cell(row, C.batch).substring(0, 100) || '', // batch_number
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

// ── AI Fill Routes ──────────────────────────────────────────────────────────
router.post('/ai-fill', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const productId = req.body.productId;
    if (!productId) return res.status(400).json({ message: 'Missing productId' });

    const pRow = await query('SELECT p.id, p.name, p.brand, c.name as category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [productId]);
    if (!pRow.length) return res.status(404).json({ message: 'Product not found' });
    const p = pRow[0];

    const { salt, description } = await geminiAutoFill(p.name, p.brand, p.category);
    
    await execute('UPDATE products SET salt = ?, description = ? WHERE id = ?', [salt, description, productId]);
    
    res.json({ success: true, salt, description });
  } catch (err) {
    if (err.message.includes('GEMINI_API_KEY')) return res.status(503).json({ message: 'Gemini API Key missing.' });
    if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({ message: 'AI quota exhausted for today. The free-tier daily limit has been reached. Please try again tomorrow or upgrade the Gemini API plan.' });
    }
    next(err);
  }
});

router.post('/ai-fill-bulk', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const ids = req.body.productIds; // Array of IDs
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'Missing productIds array' });

    // Limit batch size to prevent timeouts
    const batch = ids.slice(0, 50); 
    const results = [];

    // Process sequentially to be gentle on rate limits, or small parallel batches
    for (const id of batch) {
      try {
        const pRow = await query('SELECT p.id, p.name, p.brand, c.name as category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [id]);
        if (!pRow.length) {
          results.push({ _id: id, success: false, error: 'Not found' });
          continue;
        }
        const p = pRow[0];
        const { salt, description } = await geminiAutoFill(p.name, p.brand, p.category);
        await execute('UPDATE products SET salt = ?, description = ? WHERE id = ?', [salt, description, id]);
        results.push({ _id: id, success: true, salt, description });
        
        // Brief delay between calls to respect rate limits
        await new Promise(r => setTimeout(r, 1000)); 
      } catch (err) {
        results.push({ _id: id, success: false, error: err.message });
      }
    }

    res.json({ results });
  } catch (err) {
    next(err);
  }
});

router.get('/ai-test-models', requireAuth, requireAdmin, async (req, res) => {
  try {
     const { salt, description } = await geminiAutoFill('Dolo 650', 'Micro Labs', 'Medicine');
     res.json({ success: true, salt, description, message: 'AI models working correctly.' });
  } catch (err) {
     res.status(500).json({ message: err.message });
  }
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

// ── Related products ────────────────────────────────────────────────────────
router.get('/:id/related', [param('id').isInt({ min: 1 })], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const productId = Number(req.params.id);
    const rows = await query('SELECT brand, category_id FROM products WHERE id = ? AND is_deleted = 0 LIMIT 1', [productId]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found.' });

    const { brand, category_id } = rows[0];
    const promises = [];

    // Brand-related (same brand, different product)
    if (brand) {
      promises.push(
        query(
          `SELECT p.*, c.id AS category_id, c.name AS category_name, c.slug AS category_slug
           FROM products p LEFT JOIN categories c ON c.id = p.category_id
           WHERE p.brand = ? AND p.id <> ? AND p.is_deleted = 0 AND p.is_active = 1
           ORDER BY RAND() LIMIT 20`,
          [brand, productId]
        )
      );
    } else {
      promises.push(Promise.resolve([]));
    }

    // Category-related (same category, different product)
    if (category_id) {
      promises.push(
        query(
          `SELECT p.*, c.id AS category_id, c.name AS category_name, c.slug AS category_slug
           FROM products p LEFT JOIN categories c ON c.id = p.category_id
           WHERE p.category_id = ? AND p.id <> ? AND p.is_deleted = 0 AND p.is_active = 1
           ORDER BY RAND() LIMIT 20`,
          [category_id, productId]
        )
      );
    } else {
      promises.push(Promise.resolve([]));
    }

    const [brandRows, categoryRows] = await Promise.all(promises);

    // Deduplicate: remove from category list any that appear in brand list
    const brandIds = new Set(brandRows.map(r => r.id));
    const dedupedCategory = categoryRows.filter(r => !brandIds.has(r.id));

    res.json({
      brandRelated: brandRows.map(mapProduct),
      categoryRelated: dedupedCategory.map(mapProduct),
    });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireAdmin, auditLogger('CREATE_PRODUCT', 'Product'), [
  body('name').trim().notEmpty().isLength({ max: 200 }),
  body('category').isInt({ min: 1 }),
  body('brand').optional().trim().isLength({ max: 100 }),
  body('company').optional().trim().isLength({ max: 150 }),
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

    const result = await execute(
      `INSERT INTO products
        (code, name, slug, category_id, brand, company, description, pack, mrp, price, stock, requires_prescription,
         images_json, expiry_date, batch_number, salt, side_effects, is_active, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
      [
        req.body.code || '',
        req.body.name.trim(),
        slug,
        Number(req.body.category),
        req.body.brand || '',
        req.body.company || '',
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

router.put('/:id', requireAuth, requireAdmin, [param('id').isInt({ min: 1 })], auditLogger('UPDATE_PRODUCT', 'Product'), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const rows = await query('SELECT * FROM products WHERE id = ? AND is_deleted = 0 LIMIT 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found.' });

    const current = rows[0];
    req._auditBefore = mapProduct({ ...current, category_name: null, category_slug: null });

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
        code = ?, name = ?, slug = ?, category_id = ?, brand = ?, company = ?, description = ?, pack = ?,
        mrp = ?, price = ?, stock = ?, requires_prescription = ?, expiry_date = ?,
        batch_number = ?, salt = ?, side_effects = ?, is_active = ?
       WHERE id = ?`,
      [
        req.body.code !== undefined ? req.body.code : current.code,
        nextName,
        nextSlug,
        req.body.category !== undefined ? Number(req.body.category) : current.category_id,
        req.body.brand !== undefined ? req.body.brand : current.brand,
        req.body.company !== undefined ? req.body.company : (current.company || ''),
        req.body.description !== undefined ? req.body.description : current.description,
        req.body.pack !== undefined ? req.body.pack : current.pack,
        req.body.mrp !== undefined ? Number(req.body.mrp) : Number(current.mrp),
        req.body.price !== undefined ? Number(req.body.price) : Number(current.price),
        req.body.stock !== undefined ? Number(req.body.stock) : Number(current.stock),
        req.body.requiresPrescription !== undefined
          ? (req.body.requiresPrescription === true || req.body.requiresPrescription === 'true' ? 1 : 0)
          : current.requires_prescription,
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

// ── Dedicated image management (add / remove) ────────────────────────────────
// Uses a unique path to avoid cPanel/Passenger routing issues
router.post('/update-images/:id', requireAuth, requireAdmin, [param('id').isInt({ min: 1 })], async (req, res, next) => {
  console.log('[update-images] id=%s body=%j', req.params.id, req.body);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const rows = await query('SELECT id, images_json FROM products WHERE id = ? AND is_deleted = 0 LIMIT 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found.' });

    // Read current images safely (handle both string and auto-parsed array)
    let images = [];
    const raw = rows[0].images_json;
    if (Array.isArray(raw)) images = raw;
    else if (typeof raw === 'string' && raw.trim()) try { images = JSON.parse(raw); } catch { images = []; }
    // Normalize & drop Cloudinary links
    images = Array.isArray(images) ? images.filter((u) => typeof u === 'string').map((u) => u.trim()).filter((u) => u && !isCloudinaryUrl(u)) : [];
    const currentImages = [...images];

    const replaceMode = req.body.mode === 'replace' || req.body.replace === true || req.body.clearExisting === true;
    if (replaceMode) images = [];

    // Remove specified images
    let removeList = [];
    if (req.body.removeImages) {
      let toRemove = req.body.removeImages;
      if (typeof toRemove === 'string') try { toRemove = JSON.parse(toRemove); } catch { toRemove = []; }
      if (Array.isArray(toRemove) && toRemove.length) removeList = toRemove;
    }
    if (replaceMode && currentImages.length) removeList = [...new Set([...removeList, ...currentImages])];
    if (removeList.length) {
      images = images.filter(u => !removeList.includes(u));
    }

    // Add image by URL (prepend so it shows first)
    const isValidImageUrl = (u) => (/^https?:\/\//i.test(u) || u.startsWith('/uploads/')) && !isCloudinaryUrl(u);
    if (req.body.imageUrl && isValidImageUrl(String(req.body.imageUrl).trim())) {
      images.unshift(String(req.body.imageUrl).trim());
    }

    // Add multiple image URLs
    if (req.body.imageUrls) {
      let urls = req.body.imageUrls;
      if (typeof urls === 'string') try { urls = JSON.parse(urls); } catch { urls = []; }
      if (Array.isArray(urls)) {
        urls.filter(u => isValidImageUrl(String(u || '').trim())).forEach(u => images.unshift(String(u).trim()));
      }
    }

    images = [...new Set(images.map(u => String(u).trim()).filter(Boolean).filter((u) => !isCloudinaryUrl(u)))].slice(0, 5);

    await execute('UPDATE products SET images_json = ? WHERE id = ?', [JSON.stringify(images), req.params.id]);
    res.json({ images });
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
    let modified = 0;

    const setParts = [];
    const values = [];

    if (update.stock !== undefined) {
      setParts.push('p.stock = ?');
      values.push(Math.max(0, Number(update.stock)));
    }
    if (update.isActive !== undefined) {
      setParts.push('p.is_active = ?');
      values.push(update.isActive ? 1 : 0);
    }
    if (update.isDeleted !== undefined) {
      setParts.push('p.is_deleted = ?');
      values.push(update.isDeleted ? 1 : 0);
      if (update.isDeleted) {
        setParts.push('p.is_active = 0');
      }
    }
    if (!setParts.length) return res.status(400).json({ message: 'Nothing to update.' });

    if (applyToAll) {
      const categoryIds = await resolveCategoryIds(filterParams.category);
      const { whereSql, values: whereValues } = buildProductWhere({ admin: true, params: filterParams, categoryIds: categoryIds || [] });
      // Direct update using the same WHERE clause
      const result = await execute(
        `UPDATE products p SET ${setParts.join(', ')} ${whereSql}`,
        [...values, ...whereValues]
      );
      modified = result.affectedRows || 0;
    } else {
      const targetIds = Array.isArray(ids) ? ids.map((id) => Number(id)).filter(Boolean) : [];
      if (!targetIds.length) return res.json({ message: 'Bulk update complete.', modified: 0 });

      // Process in chunks to avoid max_allowed_packet or timeout
      const CHUNK_SIZE = 1000;
      for (let i = 0; i < targetIds.length; i += CHUNK_SIZE) {
        const chunk = targetIds.slice(i, i + CHUNK_SIZE);
        const placeholders = chunk.map(() => '?').join(', ');
        const result = await execute(
          `UPDATE products p SET ${setParts.join(', ')} WHERE p.id IN (${placeholders})`,
          [...values, ...chunk]
        );
        modified += (result.affectedRows || 0);
      }
    }

    res.json({ message: 'Bulk update complete.', modified });
  } catch (err) { next(err); }
});

router.patch('/bulk-discount', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { ids, discountPct, applyToAll = false, filterParams = {} } = req.body;
    const pct = Number(discountPct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return res.status(422).json({ message: 'discountPct must be a number between 0 and 100.' });
    }

    // Use a JS number (not .toFixed string) so MySQL receives a proper numeric parameter
    const multiplier = (100 - pct) / 100;
    let modified = 0;

    if (applyToAll) {
      const categoryIds = await resolveCategoryIds(filterParams.category);
      const { whereSql, values } = buildProductWhere({ admin: true, params: filterParams, categoryIds: categoryIds || [] });
      // Use query() (pool.query, NOT prepared statement execute) for arithmetic UPDATE
      const result = await query(
        `UPDATE products p SET p.price = ROUND(p.mrp * ?, 2) ${whereSql}`,
        [multiplier, ...values]
      );
      modified = result.affectedRows || 0;
    } else {
      const targetIds = Array.isArray(ids) ? ids.map((id) => Number(id)).filter(Boolean) : [];
      if (!targetIds.length) return res.json({ message: 'Discount applied. 0 products updated.', modified: 0 });

      const CHUNK_SIZE = 500;
      for (let i = 0; i < targetIds.length; i += CHUNK_SIZE) {
        const chunk = targetIds.slice(i, i + CHUNK_SIZE);
        const placeholders = chunk.map(() => '?').join(', ');
        const result = await query(
          `UPDATE products p SET p.price = ROUND(p.mrp * ?, 2) WHERE p.id IN (${placeholders})`,
          [multiplier, ...chunk]
        );
        modified += (result.affectedRows || 0);
      }
    }

    res.json({ message: `Discount applied. ${modified} products updated.`, modified });
  } catch (err) { next(err); }
});

module.exports = router;