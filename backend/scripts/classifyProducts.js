'use strict';

/**
 * classifyProducts.js
 *
 * One-time migration: reads all existing products that have no
 * lifestyle_category set, calls classifyLifestyle(name, brand, salt)
 * for each, and does a batched UPDATE.
 *
 * Run on the server AFTER deploying the new code:
 *   node scripts/classifyProducts.js
 *
 * Options:
 *   --all      Re-classify every product (including already-classified ones)
 *   --dry-run  Show stats without writing anything
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mysql = require('mysql2/promise');
const { classifyLifestyle } = require('../utils/classifyLifestyle');

const DRY_RUN   = process.argv.includes('--dry-run');
const ALL_MODE  = process.argv.includes('--all');
const BATCH     = 2000;

async function main() {
  const pool = mysql.createPool({
    host:     process.env.MYSQL_HOST || 'localhost',
    port:     Number(process.env.MYSQL_PORT || 3306),
    user:     process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    charset:  'utf8mb4',
    waitForConnections: true,
    connectionLimit: 3,
  });

  const conn = await pool.getConnection();
  console.log('Connected to MySQL:', process.env.MYSQL_DATABASE);

  // Add column safely — check INFORMATION_SCHEMA first (works on all MySQL versions)
  const [[colCheck]] = await conn.execute(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'lifestyle_category'`
  );
  if (Number(colCheck.cnt) === 0) {
    await conn.execute(`ALTER TABLE products ADD COLUMN lifestyle_category VARCHAR(100) NULL DEFAULT NULL`);
    console.log('lifestyle_category column added.');
  } else {
    console.log('lifestyle_category column already exists.');
  }
  // Add index if missing
  const [[idxCheck]] = await conn.execute(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND INDEX_NAME = 'idx_products_lifestyle'`
  );
  if (Number(idxCheck.cnt) === 0) {
    await conn.execute(`CREATE INDEX idx_products_lifestyle ON products (lifestyle_category)`).catch(() => {});
    console.log('Index idx_products_lifestyle created.');
  }

  const whereClause = ALL_MODE
    ? 'WHERE is_deleted = 0'
    : 'WHERE is_deleted = 0 AND lifestyle_category IS NULL';

  const [[{ total }]] = await conn.execute(`SELECT COUNT(*) AS total FROM products ${whereClause}`);
  console.log(`Products to classify: ${total}${ALL_MODE ? ' (all)' : ' (unclassified only)'}`);

  if (DRY_RUN) {
    console.log('DRY-RUN mode — no changes written.');
    conn.release();
    await pool.end();
    return;
  }

  let offset = 0;
  let classified = 0;
  let unchanged = 0;

  while (offset < Number(total)) {
    const [rows] = await conn.execute(
      `SELECT id, name, brand, salt FROM products ${whereClause} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [BATCH, offset]
    );

    if (!rows.length) break;

    // Group by lifestyle category for batch UPDATE
    const groups = new Map(); // lifestyle → [id, id, ...]

    for (const row of rows) {
      const lc = classifyLifestyle(row.name || '', row.brand || '', row.salt || '');
      const key = lc === null ? '__null__' : lc;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row.id);
    }

    for (const [key, ids] of groups) {
      const value = key === '__null__' ? null : key;
      const placeholders = ids.map(() => '?').join(',');
      await conn.execute(
        `UPDATE products SET lifestyle_category = ?, updated_at = updated_at WHERE id IN (${placeholders})`,
        [value, ...ids]
      );
      if (value !== null) classified += ids.length;
      else unchanged += ids.length;
    }

    offset += BATCH;
    process.stdout.write(`\r  Processed ${Math.min(offset, Number(total))}/${total} | Classified: ${classified} | No match: ${unchanged}`);
  }

  console.log('\n');
  console.log(`✅ Done!`);
  console.log(`   Classified    : ${classified}`);
  console.log(`   No lifestyle  : ${unchanged}`);
  console.log(`   Total touched : ${classified + unchanged}`);

  conn.release();
  await pool.end();
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
