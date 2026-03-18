'use strict';

/**
 * Reset cPanel MySQL DB and import products from Excel with proper category mapping.
 *
 * Env required:
 * MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
 *
 * Usage:
 * node scripts/resetMySqlFromExcel.js --file "e:/batla medico/886955516-item-list.xlsx"
 * node scripts/resetMySqlFromExcel.js --file "e:/batla medico/886955516-item-list.xlsx" --dry-run
 */

require('dotenv').config();
const path = require('path');
const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const slugify = require('../utils/slugify');

const STANDARD_CATEGORIES = [
  { name: 'Caps & Tabs', slug: 'caps-tabs', ord: 1 },
  { name: 'Liquids', slug: 'liquids', ord: 2 },
  { name: 'Cream & Ointment', slug: 'cream-ointment', ord: 3 },
  { name: 'Drop', slug: 'drop', ord: 4 },
  { name: 'Powder', slug: 'powder', ord: 5 },
  { name: 'Lotion', slug: 'lotion', ord: 6 },
  { name: 'Injection', slug: 'injection', ord: 7 },
  { name: 'Inhaler', slug: 'inhaler', ord: 8 },
  { name: 'Softgel Capsules', slug: 'softgel-capsules', ord: 9 },
  { name: 'Fluids', slug: 'fluids', ord: 10 },
  { name: 'High Value', slug: 'high-value', ord: 11 },
  { name: 'FMCG', slug: 'fmcg', ord: 12 },
  { name: 'Surgical', slug: 'surgicals', ord: 13 },
  { name: 'Generic', slug: 'generic', ord: 14 },
  { name: 'Keimed Generics', slug: 'keimed-generics', ord: 15 },
  { name: 'Container', slug: 'container', ord: 16 },
  { name: 'Pharma Misc', slug: 'pharma-misc', ord: 17 },
  { name: 'Fridge', slug: 'fridge', ord: 18 },
  { name: 'Allopathic', slug: 'allopathic', ord: 19 },
  { name: 'Ayurvedic', slug: 'ayurvedic', ord: 20 },
  { name: 'Cosmetics & Skincare', slug: 'cosmetics', ord: 21 },
  { name: 'Baby Products', slug: 'baby-products', ord: 22 },
  { name: 'Vaccines', slug: 'vaccines', ord: 23 },
  { name: 'Nutrition & Food', slug: 'nutrition', ord: 24 },
  { name: 'Dental Care', slug: 'dental', ord: 25 },
  { name: 'OTC Products', slug: 'otc', ord: 26 },
  { name: 'Herbal & Unani', slug: 'herbal', ord: 27 },
];

const CATEGORY_ALIASES = {
  capsandtabs: 'caps-tabs',
  capstabs: 'caps-tabs',
  liquid: 'liquids',
  creamsandointment: 'cream-ointment',
  creamsointment: 'cream-ointment',
  drops: 'drop',
  injections: 'injection',
  softgel: 'softgel-capsules',
  surgical: 'surgicals',
  generics: 'generic',
  keimedgeneric: 'keimed-generics',
  pharmamiscellaneous: 'pharma-misc',
  ayuveidc: 'ayurvedic',
  ayurvedc: 'ayurvedic',
  ayurvedik: 'ayurvedic',
  cosmetic: 'cosmetics',
  baby: 'baby-products',
  supera: 'high-value',
  ot: 'surgicals',
  highvalue2: 'high-value',
};

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : '';
}

function has(flag) {
  return process.argv.includes(flag);
}

function txt(v) {
  return String(v == null ? '' : v).trim();
}

function norm(v) {
  const raw = txt(v).toLowerCase();
  if (!raw) return '';
  const n = raw
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const compact = n.replace(/-/g, '');
  return CATEGORY_ALIASES[n] || CATEGORY_ALIASES[compact] || n;
}

function head(v) {
  return txt(v).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function findHeaderRow(rows) {
  for (let i = 0; i < rows.length; i += 1) {
    const r = (rows[i] || []).map(head);
    const hasItem = r.includes('item') || r.includes('itemname') || r.includes('name');
    const hasCategory = r.includes('itemcategory') || r.includes('category');
    const hasMrp = r.includes('mrp') || r.includes('rate');
    if ((hasItem && hasCategory) || (hasItem && hasMrp)) return i;
  }
  return -1;
}

function colMap(headerRow) {
  const h = headerRow.map(head);
  const find = (keys) => {
    for (const k of keys) {
      const i = h.indexOf(k);
      if (i >= 0) return i;
    }
    return -1;
  };
  return {
    code: find(['code', 'barcode', 'itemcode', 'productcode']),
    name: find(['itemname', 'item', 'name', 'productname', 'product']),
    pack: find(['pack', 'packing', 'unit']),
    brand: find(['company', 'brand', 'manufacturer']),
    mrp: find(['mrp', 'rate']),
    price: find(['price', 'srate', 'saleprice']),
    stock: find(['stock', 'qty', 'quantity']),
    category: find(['itemcategory', 'category']),
  };
}

function getCell(row, i) {
  if (i < 0 || i >= row.length) return '';
  return row[i];
}

async function ensureSchema(conn) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(150) NOT NULL,
      slug VARCHAR(160) NOT NULL,
      icon VARCHAR(255) NULL,
      ord INT NOT NULL DEFAULT 0,
      is_deleted TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_categories_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      code VARCHAR(50) NOT NULL DEFAULT '',
      name VARCHAR(200) NOT NULL,
      slug VARCHAR(220) NOT NULL,
      category_id BIGINT UNSIGNED NOT NULL,
      brand VARCHAR(100) NOT NULL DEFAULT '',
      description TEXT NULL,
      pack VARCHAR(100) NOT NULL DEFAULT '',
      mrp DECIMAL(12,2) NOT NULL DEFAULT 0,
      price DECIMAL(12,2) NOT NULL DEFAULT 0,
      stock INT NOT NULL DEFAULT 0,
      requires_prescription TINYINT(1) NOT NULL DEFAULT 0,
      images_json JSON NULL,
      expiry_date DATETIME NULL,
      batch_number VARCHAR(50) NOT NULL DEFAULT '',
      salt VARCHAR(500) NOT NULL DEFAULT '',
      side_effects VARCHAR(1000) NOT NULL DEFAULT '',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      is_deleted TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_products_slug (slug),
      KEY idx_products_category (category_id),
      KEY idx_products_active_deleted (is_active, is_deleted),
      FULLTEXT KEY ftx_products_search (name, brand, description),
      CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function run() {
  const file = arg('--file');
  const sheetArg = arg('--sheet');
  const dryRun = has('--dry-run');

  if (!file) {
    throw new Error('Missing --file argument');
  }

  const excelPath = path.resolve(process.cwd(), file);
  const wb = XLSX.readFile(excelPath, { cellDates: false });
  const sheetName = sheetArg || wb.SheetNames[0];
  if (!sheetName || !wb.Sheets[sheetName]) {
    throw new Error(`Sheet not found: ${sheetArg || '(empty)'}`);
  }

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' });
  const headerIndex = findHeaderRow(rows);
  if (headerIndex < 0) throw new Error('Could not detect header row.');

  const map = colMap(rows[headerIndex]);
  if (map.name < 0) throw new Error('Could not detect item/name column.');

  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    charset: 'utf8mb4',
    multipleStatements: false,
  });

  await ensureSchema(conn);

  if (!dryRun) {
    await conn.execute('SET FOREIGN_KEY_CHECKS=0');
    await conn.execute('TRUNCATE TABLE products');
    await conn.execute('TRUNCATE TABLE categories');
    await conn.execute('SET FOREIGN_KEY_CHECKS=1');

    const catSql = 'INSERT INTO categories (name, slug, ord, is_deleted) VALUES (?, ?, ?, 0)';
    for (const c of STANDARD_CATEGORIES) {
      await conn.execute(catSql, [c.name, c.slug, c.ord]);
    }
  }

  const [categoryRows] = await conn.query('SELECT id, name, slug FROM categories WHERE is_deleted=0');
  const categoryLookup = new Map();
  for (const c of categoryRows) {
    const slugKey = norm(c.slug);
    const nameKey = norm(c.name);
    if (slugKey) categoryLookup.set(slugKey, c.id);
    if (nameKey) categoryLookup.set(nameKey, c.id);
  }

  const defaultCategoryId = categoryLookup.get('caps-tabs') || (categoryRows[0] && categoryRows[0].id);
  if (!defaultCategoryId) throw new Error('No categories found in MySQL.');

  const docs = [];
  const usedSlugs = new Set();
  const unknown = new Map();

  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] || [];
    const name = txt(getCell(row, map.name));
    if (!name) continue;

    const rawCategory = txt(getCell(row, map.category));
    const normalizedCategory = norm(rawCategory);
    const categoryId = categoryLookup.get(normalizedCategory) || defaultCategoryId;

    if (!categoryLookup.get(normalizedCategory) && rawCategory) {
      unknown.set(rawCategory, (unknown.get(rawCategory) || 0) + 1);
    }

    const mrp = Math.max(0, num(getCell(row, map.mrp), 0));
    const price = Math.max(0, num(getCell(row, map.price), mrp));
    const stock = Math.max(0, Math.trunc(num(getCell(row, map.stock), 0)));

    let slugBase = slugify(name);
    if (!slugBase) slugBase = `product-${docs.length + 1}`;
    let slug = slugBase;
    let n = 2;
    while (usedSlugs.has(slug)) {
      slug = `${slugBase}-${n}`;
      n += 1;
    }
    usedSlugs.add(slug);

    docs.push({
      code: txt(getCell(row, map.code)),
      name,
      slug,
      category_id: categoryId,
      brand: txt(getCell(row, map.brand)),
      description: '',
      pack: txt(getCell(row, map.pack)),
      mrp,
      price,
      stock,
    });
  }

  if (!docs.length) {
    await conn.end();
    throw new Error('No valid rows parsed from Excel.');
  }

  if (!dryRun) {
    const sql = `
      INSERT INTO products
      (code, name, slug, category_id, brand, description, pack, mrp, price, stock,
       requires_prescription, images_json, expiry_date, batch_number, salt, side_effects,
       is_active, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, JSON_ARRAY(), NULL, '', '', '', 1, 0)
    `;

    for (const p of docs) {
      await conn.execute(sql, [
        p.code,
        p.name,
        p.slug,
        p.category_id,
        p.brand,
        p.description,
        p.pack,
        p.mrp,
        p.price,
        p.stock,
      ]);
    }
  }

  console.log('MYSQL RESET FROM EXCEL REPORT');
  console.log('-----------------------------');
  console.log('File:', excelPath);
  console.log('Sheet:', sheetName);
  console.log('Header row:', headerIndex + 1);
  console.log('Parsed products:', docs.length);
  console.log('Categories:', categoryRows.length);
  console.log('Dry run:', dryRun ? 'YES (no DB writes)' : 'NO (MySQL updated)');

  if (unknown.size) {
    const top = [...unknown.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    console.log('Top unmapped category labels (fallback used):');
    top.forEach(([k, v]) => console.log(`- ${k}: ${v}`));
  }

  await conn.end();
}

run().catch((err) => {
  console.error('MYSQL_RESET_FAILED:', err.message);
  process.exit(1);
});
