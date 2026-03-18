'use strict';
/**
 * Seed / upsert all categories required by the CategoryNav and PARENT_GROUPS.
 * Safe to run multiple times — existing categories are updated, not duplicated.
 *
 * Usage:
 *   node backend/scripts/seedCategories.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { execute, query } = require('../db/mysql');
const { ensureCoreSchema } = require('../db/schema');

// ── Complete category list used across the whole app ─────────────────────────
// These slugs must match the ones in:
//   frontend/src/components/CategoryNav.jsx (children slugs)
//   backend/routes/products.js (PARENT_GROUPS values)
//   backend/scripts/seedFromCSV.js (getCategorySlug return values)
const CATEGORIES = [
  // ── Core dosage-form types ────────────────────────────────────────────────
  { name: 'Caps & Tablets',         slug: 'caps-tabs',        ord:  1 },
  { name: 'Liquids & Syrups',       slug: 'liquids',          ord:  2 },
  { name: 'Cream & Ointment',       slug: 'cream-ointment',   ord:  3 },
  { name: 'Drops',                  slug: 'drop',             ord:  4 },
  { name: 'Powder',                 slug: 'powder',           ord:  5 },
  { name: 'Lotion',                 slug: 'lotion',           ord:  6 },
  { name: 'Injection',              slug: 'injection',        ord:  7 },
  { name: 'Inhaler',                slug: 'inhaler',          ord:  8 },
  { name: 'Softgel Capsules',       slug: 'softgel-capsules', ord:  9 },
  { name: 'Fluids & IV',            slug: 'fluids',           ord: 10 },

  // ── Product sub-types ─────────────────────────────────────────────────────
  { name: 'High Value Medicines',   slug: 'high-value',       ord: 11 },
  { name: 'FMCG / Consumer',        slug: 'fmcg',             ord: 12 },
  { name: 'Surgical & Supports',    slug: 'surgicals',        ord: 13 },
  { name: 'Generic Medicines',      slug: 'generic',          ord: 14 },
  { name: 'Containers & Devices',   slug: 'container',        ord: 15 },
  { name: 'Pharma Misc',            slug: 'pharma-misc',      ord: 16 },
  { name: 'Refrigerated',           slug: 'fridge',           ord: 17 },

  // ── Therapy / system types ────────────────────────────────────────────────
  { name: 'Allopathic',             slug: 'allopathic',       ord: 19 },
  { name: 'Ayurvedic',              slug: 'ayurvedic',        ord: 20 },
  { name: 'Homeopathy',             slug: 'homeopathy',       ord: 21 },
  { name: 'Vaccines',               slug: 'vaccines',         ord: 22 },
  { name: 'Dental Care',            slug: 'dental',           ord: 23 },
  { name: 'OTC',                    slug: 'otc',              ord: 24 },
  { name: 'Herbal',                 slug: 'herbal',           ord: 25 },
  { name: 'Nutrition',              slug: 'nutrition',        ord: 26 },

  // ── Fallback ─────────────────────────────────────────────────────────────
  { name: 'Other',                  slug: 'other',            ord: 99 },
];

async function main() {
  await ensureCoreSchema();

  let added = 0;
  let updated = 0;

  for (const cat of CATEGORIES) {
    const rows = await query('SELECT id FROM categories WHERE slug = ? LIMIT 1', [cat.slug]);
    if (rows.length) {
      await execute(
        'UPDATE categories SET name = ?, ord = ?, is_deleted = 0 WHERE slug = ?',
        [cat.name, cat.ord, cat.slug]
      );
      console.log(`  ✓ updated  ${cat.slug.padEnd(22)} → "${cat.name}"`);
      updated++;
    } else {
      await execute(
        'INSERT INTO categories (name, slug, ord, is_deleted) VALUES (?, ?, ?, 0)',
        [cat.name, cat.slug, cat.ord]
      );
      console.log(`  + added    ${cat.slug.padEnd(22)} → "${cat.name}"`);
      added++;
    }
  }

  console.log(`\nDone. ${added} added, ${updated} updated.`);
  process.exit(0);
}

main().catch(err => {
  console.error('seedCategories error:', err.message);
  process.exit(1);
});
