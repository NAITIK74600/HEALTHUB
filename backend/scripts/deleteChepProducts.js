'use strict';
/**
 * deleteChepProducts.js
 * Permanently hard-deletes all products with price < 50 from the database.
 * Usage:  node scripts/deleteChepProducts.js
 * Run on server after: cd ~/batla-medicos/backend && node scripts/deleteChepProducts.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { query } = require('../db/mysql');

async function run() {
  // Step 1: Show count before deleting
  const [{ total }] = await query('SELECT COUNT(*) AS total FROM products WHERE price < 50');
  console.log(`\nProducts with price < ₹50: ${total}`);

  if (total === 0) {
    console.log('Nothing to delete. Exiting.');
    process.exit(0);
  }

  // Step 2: Show sample
  const samples = await query(
    'SELECT id, name, brand, price FROM products WHERE price < 50 ORDER BY price ASC LIMIT 10'
  );
  console.log('\nSample products to be deleted:');
  samples.forEach(p => console.log(`  [${p.id}] ${p.name} — ₹${p.price} (${p.brand || 'no brand'})`));

  // Step 3: Delete
  console.log(`\nDeleting ${total} products...`);
  const result = await query('DELETE FROM products WHERE price < 50');
  console.log(`✓ Deleted ${result.affectedRows} products with price < ₹50.\n`);

  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
