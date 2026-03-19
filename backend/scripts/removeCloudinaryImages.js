#!/usr/bin/env node
/**
 * Remove all Cloudinary placeholder images from products.
 * Finds any URL containing "res.cloudinary.com" in images_json and removes it.
 * Products left with no images will have an empty array [].
 *
 * Usage:
 *   node backend/scripts/removeCloudinaryImages.js          # dry-run (preview)
 *   node backend/scripts/removeCloudinaryImages.js --apply   # actually update DB
 */
'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

const DRY_RUN = !process.argv.includes('--apply');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    charset: 'utf8mb4',
    connectionLimit: 5,
  });

  console.log(DRY_RUN ? '=== DRY RUN (add --apply to commit changes) ===' : '=== APPLYING CHANGES ===');

  // Find all products that have Cloudinary URLs in images_json
  const [rows] = await pool.query(
    "SELECT id, name, images_json FROM products WHERE images_json LIKE '%res.cloudinary.com%'"
  );

  console.log(`Found ${rows.length} products with Cloudinary images.\n`);

  let cleaned = 0;
  for (const row of rows) {
    let images = [];
    const raw = row.images_json;
    if (Array.isArray(raw)) images = raw;
    else if (typeof raw === 'string' && raw.trim()) {
      try { images = JSON.parse(raw); } catch { images = []; }
    }

    const before = [...images];
    const after = images.filter(url => !String(url).includes('res.cloudinary.com'));

    const removed = before.length - after.length;
    if (removed === 0) continue;

    console.log(`[${row.id}] ${row.name}`);
    console.log(`  Before (${before.length}): ${before.join(', ')}`);
    console.log(`  After  (${after.length}): ${after.length ? after.join(', ') : '(empty)'}`);
    console.log(`  Removed: ${removed} Cloudinary URL(s)\n`);

    if (!DRY_RUN) {
      await pool.execute('UPDATE products SET images_json = ? WHERE id = ?', [JSON.stringify(after), row.id]);
    }
    cleaned++;
  }

  console.log(`\n${DRY_RUN ? 'Would clean' : 'Cleaned'} ${cleaned} products.`);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
