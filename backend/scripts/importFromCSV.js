'use strict';
/**
 * Import medicines from paid_indian_medicine_data.csv into MySQL.
 *
 * CSV columns expected:
 *   id, name, price, Is_discontinued, manufacturer_name, type,
 *   pack_size_label, short_composition1, short_composition2,
 *   salt_composition, medicine_desc, side_effects, drug_interactions
 *
 * Usage (from backend/ folder):
 *   node scripts/importFromCSV.js --file "e:/batla medico/paid_indian_medicine_data.csv"
 *   node scripts/importFromCSV.js --file "..." --dry-run      # no DB writes
 *   node scripts/importFromCSV.js --file "..." --limit 1000   # import first N rows
 *   node scripts/importFromCSV.js --file "..." --truncate     # wipe products table first
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const mysql = require('mysql2/promise');

// ── helpers ──────────────────────────────────────────────────────────────────
function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : '';
}
function has(flag) { return process.argv.includes(flag); }
function txt(v) { return String(v == null ? '' : v).trim(); }
function num(v, def = 0) { const n = Number(v); return Number.isFinite(n) ? n : def; }

function toSlug(name, id) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200);
  return `${base}-${id}`;
}

// Map CSV `type` field → category slug in your DB
const TYPE_TO_SLUG = {
  allopathy:  'caps-tabs',
  ayurvedic:  'ayurvedic',
  ayurveda:   'ayurvedic',
  homeopathy: 'caps-tabs',
  unani:      'herbal',
  siddha:     'herbal',
  surgical:   'surgicals',
  otc:        'otc',
  cosmetic:   'cosmetics',
  cosmetics:  'cosmetics',
  nutritional:'nutrition',
  nutrition:  'nutrition',
  dental:     'dental',
  baby:       'baby-products',
  vaccine:    'vaccines',
};

const BATCH_SIZE = 500;  // rows per INSERT batch

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const file    = arg('--file');
  const dryRun  = has('--dry-run');
  const truncate= has('--truncate');
  const limit   = arg('--limit') ? parseInt(arg('--limit'), 10) : Infinity;

  if (!file || !fs.existsSync(file)) {
    console.error('Usage: node scripts/importFromCSV.js --file <path/to/csv>');
    console.error('  --dry-run    : parse & validate without writing to DB');
    console.error('  --truncate   : DELETE all existing products first');
    console.error('  --limit N    : only import first N rows');
    process.exit(1);
  }

  console.log(`\n📂  File   : ${file}`);
  console.log(`🔧  Mode   : ${dryRun ? 'DRY-RUN (no DB writes)' : 'LIVE'}`);
  if (limit < Infinity) console.log(`🔢  Limit  : ${limit} rows`);
  if (truncate && !dryRun) console.log(`⚠️   Truncate products table before import`);

  // ── DB connection ─────────────────────────────────────────────────────────
  let conn;
  let catMap = {}; // slug → id

  if (!dryRun) {
    conn = await mysql.createConnection({
      host:     process.env.MYSQL_HOST     || 'localhost',
      port:     parseInt(process.env.MYSQL_PORT || '3306'),
      user:     process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      multipleStatements: false,
    });
    console.log('✅  DB connected');

    // Ensure extra categories exist
    await ensureExtraCategories(conn);

    // Load category map
    const [rows] = await conn.execute('SELECT id, slug FROM categories WHERE is_deleted = 0');
    for (const r of rows) catMap[r.slug] = r.id;
    console.log(`📋  Loaded ${Object.keys(catMap).length} categories`);

    if (truncate) {
      await conn.execute('DELETE FROM products');
      console.log('🗑️   Products table truncated');
    }
  }

  // ── streaming CSV parse ───────────────────────────────────────────────────
  let parsed = 0, inserted = 0, skipped = 0;
  let batch = [];

  const parser = fs
    .createReadStream(file, { encoding: 'utf8' })
    .pipe(parse({ columns: true, skip_empty_lines: true, relax_quotes: true, trim: true }));

  for await (const row of parser) {
    if (parsed >= limit) break;

    const name = txt(row.name);
    if (!name) { skipped++; continue; }

    const price        = num(row.price, 0);
    const mrp          = price;                        // CSV has only one price
    const discontinued = txt(row.Is_discontinued).toLowerCase();
    const isActive     = (discontinued === 'true' || discontinued === '1') ? 0 : 1;
    const brand        = txt(row.manufacturer_name).substring(0, 100);
    const pack         = txt(row.pack_size_label).substring(0, 100);
    const salt         = txt(row.salt_composition).substring(0, 500);
    const description  = txt(row.medicine_desc);
    const sideEffects  = txt(row.side_effects).substring(0, 1000);
    const typeRaw      = txt(row.type).toLowerCase();
    const catSlug      = TYPE_TO_SLUG[typeRaw] || 'caps-tabs';
    const slug         = toSlug(name, parsed + 1);

    parsed++;

    if (dryRun) {
      if (parsed <= 5) {
        console.log(`  [${parsed}] "${name}" | cat="${catSlug}" | price=${price} | active=${isActive}`);
      } else if (parsed === 6) {
        console.log('  ... (showing first 5 rows only in dry-run)');
      }
      continue;
    }

    const catId = catMap[catSlug] || catMap['caps-tabs'];
    if (!catId) { skipped++; continue; }

    batch.push([
      '',          // code
      name,
      slug,
      catId,
      brand,
      description || null,
      pack,
      mrp,
      price,
      0,           // stock (unknown)
      0,           // requires_prescription
      null,        // images_json
      null,        // expiry_date
      '',          // batch_number
      salt,
      sideEffects,
      isActive,
      0,           // is_deleted
    ]);

    if (batch.length >= BATCH_SIZE) {
      await flushBatch(conn, batch);
      inserted += batch.length;
      batch = [];
      process.stdout.write(`\r  Inserted ${inserted} rows...`);
    }
  }

  // flush remaining rows
  if (!dryRun && batch.length > 0) {
    await flushBatch(conn, batch);
    inserted += batch.length;
  }

  console.log('\n');
  if (dryRun) {
    console.log(`✅  Dry-run done. Parsed ${parsed} rows, would skip ${skipped}.`);
  } else {
    console.log(`✅  Import done. Inserted ${inserted} rows, skipped ${skipped}.`);
    await conn.end();
  }
}

async function flushBatch(conn, batch) {
  const sql = `
    INSERT IGNORE INTO products
      (code, name, slug, category_id, brand, description, pack,
       mrp, price, stock, requires_prescription, images_json,
       expiry_date, batch_number, salt, side_effects, is_active, is_deleted)
    VALUES ?
  `;
  await conn.query(sql, [batch]);
}

// Ensure categories that may not exist yet (herbal, otc, nutrition, dental etc.)
async function ensureExtraCategories(conn) {
  const extras = [
    { name: 'Herbal & Unani',      slug: 'herbal',        ord: 27 },
    { name: 'OTC Products',        slug: 'otc',           ord: 26 },
    { name: 'Nutrition & Food',    slug: 'nutrition',     ord: 24 },
    { name: 'Dental Care',         slug: 'dental',        ord: 25 },
    { name: 'Baby Products',       slug: 'baby-products', ord: 22 },
    { name: 'Vaccines',            slug: 'vaccines',      ord: 23 },
    { name: 'Cosmetics & Skincare',slug: 'cosmetics',     ord: 21 },
    { name: 'Ayurvedic',           slug: 'ayurvedic',     ord: 20 },
  ];
  for (const c of extras) {
    await conn.execute(
      `INSERT IGNORE INTO categories (name, slug, ord) VALUES (?, ?, ?)`,
      [c.name, c.slug, c.ord]
    );
  }
}

main().catch((err) => {
  console.error('\n❌  Error:', err.message);
  process.exit(1);
});
