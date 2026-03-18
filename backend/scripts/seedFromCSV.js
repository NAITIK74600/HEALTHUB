'use strict';

/**
 * Seed products from paid_indian_medicine_data.csv into MySQL.
 *
 * CSV columns:
 *   id, name, price, Is_discontinued, manufacturer_name, type,
 *   pack_size_label, short_composition1, short_composition2,
 *   salt_composition, medicine_desc, side_effects, drug_interactions
 *
 * Usage:
 *   node scripts/seedFromCsv.js --file "e:/batla medico/paid_indian_medicine_data.csv"
 *   node scripts/seedFromCsv.js --file "..." --limit 2000
 *   node scripts/seedFromCsv.js --file "..." --limit 0   (import ALL rows)
 *   node scripts/seedFromCsv.js --file "..." --dry-run
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs       = require('fs');
const path     = require('path');
const { parse } = require('csv-parse');
const mysql    = require('mysql2/promise');

// ── CLI args ──────────────────────────────────────────────────────────────────
function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : '';
}
function has(flag) { return process.argv.includes(flag); }

const CSV_FILE = arg('--file') || path.join(__dirname, '../../../paid_indian_medicine_data.csv');
const LIMIT    = has('--limit') ? Number(arg('--limit')) : 5000; // 0 = all
const DRY_RUN  = has('--dry-run');
const BATCH    = 100;

if (!fs.existsSync(CSV_FILE)) {
  console.error(`CSV file not found: ${CSV_FILE}`);
  process.exit(1);
}

// ── Category definitions ──────────────────────────────────────────────────────
const STANDARD_CATEGORIES = [
  { name: 'Caps & Tabs',          slug: 'caps-tabs',         ord: 1  },
  { name: 'Liquids',              slug: 'liquids',           ord: 2  },
  { name: 'Cream & Ointment',     slug: 'cream-ointment',    ord: 3  },
  { name: 'Drop',                 slug: 'drop',              ord: 4  },
  { name: 'Powder',               slug: 'powder',            ord: 5  },
  { name: 'Lotion',               slug: 'lotion',            ord: 6  },
  { name: 'Injection',            slug: 'injection',         ord: 7  },
  { name: 'Inhaler',              slug: 'inhaler',           ord: 8  },
  { name: 'Softgel Capsules',     slug: 'softgel-capsules',  ord: 9  },
  { name: 'FMCG',                 slug: 'fmcg',              ord: 12 },
  { name: 'Surgical',             slug: 'surgicals',         ord: 13 },
  { name: 'Allopathic',           slug: 'allopathic',        ord: 19 },
  { name: 'Ayurvedic',            slug: 'ayurvedic',         ord: 20 },
  { name: 'Homeopathy',           slug: 'homeopathy',        ord: 21 },
  { name: 'Other',                slug: 'other',             ord: 99 },
];

// Determine category slug from pack_size_label and type
function getCategorySlug(packLabel, type) {
  const p = String(packLabel || '').toLowerCase();
  const t = String(type || '').toLowerCase().replace(/\s+/g, '');

  if (t.includes('ayurved'))   return 'ayurvedic';
  if (t.includes('homeopath')) return 'homeopathy';

  if (/tablet|capsule|cap\b|tab\b/.test(p)) {
    if (/softgel/i.test(p)) return 'softgel-capsules';
    return 'caps-tabs';
  }
  if (/syrup|suspension|solution|oral liquid|oral drops/.test(p)) return 'liquids';
  if (/eye drop|ear drop|nasal drop|drop/.test(p)) return 'drop';
  if (/cream|ointment|gel/.test(p)) return 'cream-ointment';
  if (/lotion/.test(p)) return 'lotion';
  if (/powder/.test(p)) return 'powder';
  if (/injection|vial|infusion/.test(p)) return 'injection';
  if (/inhaler|rotacap|respule/.test(p)) return 'inhaler';
  if (/spray/.test(p)) return 'drop';
  if (/strip|blister/.test(p)) return 'caps-tabs';
  if (/bottle/.test(p)) return 'liquids';

  // fallback by type
  if (t.includes('allopathy') || t.includes('allopathic')) return 'allopathic';
  return 'other';
}

function slugify(str) {
  return String(str || '').trim().toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function makeSlug(name, id) {
  const base = slugify(name).substring(0, 180);
  return base ? `${base}-${id}` : `product-${id}`;
}

async function main() {
  // ── In dry-run mode, just parse and show sample ─────────────────────────
  if (DRY_RUN) {
    console.log(`Reading CSV: ${CSV_FILE}`);
    const records = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE)
        .pipe(parse({ columns: true, skip_empty_lines: true, relax_column_count: true, bom: true }))
        .on('data', (row) => { if (records.length < 3) records.push(row); })
        .on('end', resolve)
        .on('error', reject);
    });
    console.log('DRY-RUN: sample row:', JSON.stringify(records[0], null, 2));
    console.log('DRY-RUN: detected category →', getCategorySlug(records[0].pack_size_label, records[0].type));
    return;
  }

  const pool = mysql.createPool({
    host:     process.env.MYSQL_HOST || 'localhost',
    port:     Number(process.env.MYSQL_PORT || 3306),
    user:     process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    charset:  'utf8mb4',
    waitForConnections: true,
    connectionLimit: 5,
  });

  const conn = await pool.getConnection();
  console.log('Connected to MySQL:', process.env.MYSQL_DATABASE);

  // ── Ensure categories exist ──────────────────────────────────────────────
  console.log('Upserting categories...');
  for (const cat of STANDARD_CATEGORIES) {
    await conn.execute(
      `INSERT INTO categories (name, slug, ord) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), ord = VALUES(ord)`,
      [cat.name, cat.slug, cat.ord]
    );
  }

  // Load category slug → id map
  const [catRows] = await conn.execute('SELECT id, slug FROM categories');
  const catMap = {};
  for (const r of catRows) catMap[r.slug] = r.id;
  console.log(`Categories ready: ${Object.keys(catMap).length}`);

  // ── Stream CSV ───────────────────────────────────────────────────────────
  console.log(`Reading CSV: ${CSV_FILE}`);
  console.log(`Limit: ${LIMIT === 0 ? 'ALL' : LIMIT} rows`);

  const records = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE)
      .pipe(parse({ columns: true, skip_empty_lines: true, relax_column_count: true, bom: true }))
      .on('data', (row) => {
        if (LIMIT > 0 && records.length >= LIMIT) return;
        records.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });
  console.log(`Parsed ${records.length} rows from CSV`);

  // ── Insert in batches ────────────────────────────────────────────────────
  let inserted = 0, skipped = 0, errors = 0;

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    for (const row of batch) {
      try {
        const isDiscontinued = String(row.Is_discontinued || '').toUpperCase() === 'TRUE';
        const price  = parseFloat(row.price) || 0;
        const slug   = getCategorySlug(row.pack_size_label, row.type);
        const catId  = catMap[slug] || catMap['other'];
        const productSlug = makeSlug(row.name, row.id);

        await conn.execute(
          `INSERT INTO products
             (code, name, slug, category_id, brand, description, pack, mrp, price,
              stock, requires_prescription, salt, side_effects, is_active, is_deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             brand = VALUES(brand),
             description = VALUES(description),
             pack = VALUES(pack),
             mrp = VALUES(mrp),
             price = VALUES(price),
             salt = VALUES(salt),
             side_effects = VALUES(side_effects),
             requires_prescription = VALUES(requires_prescription),
             is_active = VALUES(is_active)`,
          [
            String(row.id || '').trim().substring(0, 50),       // code
            String(row.name || '').trim().substring(0, 200),    // name
            productSlug,                                         // slug
            catId,                                               // category_id
            String(row.manufacturer_name || '').trim().substring(0, 100), // brand
            String(row.medicine_desc || '').trim() || null,     // description (full TEXT, no truncation)
            String(row.pack_size_label || '').trim().substring(0, 100),   // pack
            price,                                               // mrp
            price,                                               // price
            50,                                                  // stock default
            /prescription|rx\b/i.test(String(row.medicine_desc || '') + String(row.name || '')) ? 1 : 0, // requires_prescription
            String(row.salt_composition || '').trim().substring(0, 500),  // salt
            String(row.side_effects || '').trim().substring(0, 1000),     // side_effects
            isDiscontinued ? 0 : 1,                             // is_active
          ]
        );
        inserted++;
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') {
          console.error(`Row ${i} error:`, err.message, '| Name:', row.name);
          errors++;
        } else {
          skipped++;
        }
      }
    }
    process.stdout.write(`\rProgress: ${Math.min(i + BATCH, records.length)}/${records.length} | Inserted: ${inserted} Skipped: ${skipped} Errors: ${errors}`);
  }

  console.log(`\n✅ Done! Inserted: ${inserted} | Skipped (dup): ${skipped} | Errors: ${errors}`);

  conn.release();
  await pool.end();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
