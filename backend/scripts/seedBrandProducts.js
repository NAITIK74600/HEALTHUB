'use strict';
/**
 * Seed Mamaearth & Bella Vita (Vellabita) products into the database.
 * Usage: node backend/scripts/seedBrandProducts.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { query, execute, getPool } = require('../db/mysql');

function slugify(str) {
  return String(str || '').trim().toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function getCatId(slug) {
  const rows = await query('SELECT id FROM categories WHERE slug = ? AND is_deleted = 0 LIMIT 1', [slug]);
  return rows[0]?.id || null;
}

async function ensureCategory(name, slug) {
  let id = await getCatId(slug);
  if (id) return id;
  const result = await execute(
    'INSERT IGNORE INTO categories (name, slug, ord) VALUES (?, ?, 99)',
    [name, slug]
  );
  if (result.insertId) return result.insertId;
  return (await getCatId(slug));
}

async function insertProduct(p, catId) {
  const base = slugify(p.name);
  let slug = base;
  let suffix = 2;
  while ((await query('SELECT id FROM products WHERE slug = ? LIMIT 1', [slug])).length) {
    slug = `${base}-${suffix++}`;
  }
  await execute(
    `INSERT IGNORE INTO products
      (code, name, slug, category_id, brand, description, pack, mrp, price, stock,
       requires_prescription, images_json, is_active, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1, 0)`,
    [
      p.code || '',
      p.name,
      slug,
      catId,
      p.brand,
      p.description || '',
      p.pack || '',
      p.mrp,
      p.price,
      p.stock || 50,
      p.image ? JSON.stringify([p.image]) : null,
    ]
  );
  return slug;
}

const MAMAEARTH = [
  { name: 'Mamaearth Vitamin C Face Wash 100ml', brand: 'Mamaearth', pack: '100ml', mrp: 349, price: 314, description: 'Vitamin C face wash for skin illumination with turmeric. Removes dirt and impurities while brightening skin.', catSlug: 'fmcg', image: 'https://images.mamaearth.in/catalog/product/v/i/vitamin-c-face-wash-100ml.jpg' },
  { name: 'Mamaearth Onion Hair Oil 250ml', brand: 'Mamaearth', pack: '250ml', mrp: 499, price: 449, description: 'Onion oil for hair fall control with redensyl. Nourishes scalp and strengthens hair roots.', catSlug: 'fmcg', image: 'https://images.mamaearth.in/catalog/product/o/n/onion-hair-oil-250ml.jpg' },
  { name: 'Mamaearth Onion Shampoo 250ml', brand: 'Mamaearth', pack: '250ml', mrp: 399, price: 359, description: 'Onion shampoo for hair growth & hair fall control with onion & plant keratin.', catSlug: 'fmcg', image: 'https://images.mamaearth.in/catalog/product/o/n/onion-shampoo-250ml.jpg' },
  { name: 'Mamaearth Ubtan Face Wash 100ml', brand: 'Mamaearth', pack: '100ml', mrp: 349, price: 314, description: 'Ubtan face wash for tan removal with turmeric & saffron.', catSlug: 'fmcg', image: 'https://images.mamaearth.in/catalog/product/u/b/ubtan-facewash-100ml.jpg' },
  { name: 'Mamaearth Tea Tree Face Wash 100ml', brand: 'Mamaearth', pack: '100ml', mrp: 349, price: 314, description: 'Tea tree face wash for acne & pimples with neem. Controls excess oil and clears skin.', catSlug: 'fmcg', image: 'https://images.mamaearth.in/catalog/product/t/e/tea-tree-face-wash-100ml.jpg' },
  { name: 'Mamaearth Aloe Vera Gel 300ml', brand: 'Mamaearth', pack: '300ml', mrp: 399, price: 359, description: 'Pure aloe vera gel for face & hair. Soothes, hydrates and repairs skin.', catSlug: 'fmcg' },
  { name: 'Mamaearth Rice Water Shampoo 250ml', brand: 'Mamaearth', pack: '250ml', mrp: 399, price: 359, description: 'Rice water shampoo with keratin for damage repair and smooth hair.', catSlug: 'fmcg' },
  { name: 'Mamaearth Vitamin C Face Serum 30ml', brand: 'Mamaearth', pack: '30ml', mrp: 599, price: 539, description: 'Vitamin C face serum for glowing skin with turmeric. Reduces dark spots and blemishes.', catSlug: 'cream-ointment' },
  { name: 'Mamaearth Bye Bye Blemishes Face Cream 30g', brand: 'Mamaearth', pack: '30g', mrp: 399, price: 359, description: 'Bye bye blemishes cream with mulberry extract & vitamin C for pigmentation control.', catSlug: 'cream-ointment' },
  { name: 'Mamaearth Anti-Hair Fall Kit', brand: 'Mamaearth', pack: '1 Kit', mrp: 1198, price: 999, description: 'Complete anti-hair fall kit with onion shampoo, conditioner and hair oil.', catSlug: 'fmcg' },
  { name: 'Mamaearth Moisturizing Bathing Bar 125g (Pack of 5)', brand: 'Mamaearth', pack: '5x125g', mrp: 449, price: 404, description: 'Moisturizing soap bar with shea butter. Gentle on skin, keeps it soft.', catSlug: 'fmcg' },
  { name: 'Mamaearth Nourishing Baby Hair Oil 200ml', brand: 'Mamaearth', pack: '200ml', mrp: 399, price: 359, description: 'Gentle baby hair oil with coconut, almond and jojoba oil.', catSlug: 'fmcg' },
  { name: 'Mamaearth Milky Soft Body Lotion for Babies 400ml', brand: 'Mamaearth', pack: '400ml', mrp: 499, price: 449, description: 'Dermatologically tested milky soft body lotion for babies with oats, milk and calendula.', catSlug: 'lotion' },
  { name: 'Mamaearth Rose Water Face Toner 200ml', brand: 'Mamaearth', pack: '200ml', mrp: 399, price: 359, description: 'Alcohol-free rose water toner with witch hazel for pore tightening.', catSlug: 'fmcg' },
  { name: 'Mamaearth Charcoal Face Scrub 100g', brand: 'Mamaearth', pack: '100g', mrp: 349, price: 314, description: 'Activated charcoal face scrub for deep cleansing and exfoliation with walnut.', catSlug: 'fmcg' },
  { name: 'Mamaearth Vitamin C Body Lotion 400ml', brand: 'Mamaearth', pack: '400ml', mrp: 499, price: 449, description: 'Vitamin C body lotion with honey for radiant skin and deep moisturization.', catSlug: 'lotion' },
  { name: 'Mamaearth Onion Conditioner 250ml', brand: 'Mamaearth', pack: '250ml', mrp: 399, price: 359, description: 'Onion conditioner for hair fall control with coconut oil. Makes hair smooth.', catSlug: 'fmcg' },
  { name: 'Mamaearth Retinol Face Serum 30ml', brand: 'Mamaearth', pack: '30ml', mrp: 599, price: 539, description: 'Retinol face serum for anti-aging with niacinamide and bakuchi.', catSlug: 'cream-ointment' },
  { name: 'Mamaearth CoCo Body Wash 300ml', brand: 'Mamaearth', pack: '300ml', mrp: 349, price: 314, description: 'CoCo body wash with coffee & cocoa for energizing shower experience.', catSlug: 'fmcg' },
  { name: 'Mamaearth Natural Lip Balm 4.5g', brand: 'Mamaearth', pack: '4.5g', mrp: 199, price: 179, description: 'Natural lip balm with vitamin E and shea butter. Heals dry chapped lips.', catSlug: 'cream-ointment' },
];

const BELLAVITA = [
  { name: 'Bella Vita Organic Vitamin C Face Wash 150ml', brand: 'Bella Vita', pack: '150ml', mrp: 299, price: 269, description: 'Vitamin C face wash with turmeric for brightening & deep cleansing.', catSlug: 'fmcg' },
  { name: 'Bella Vita Luxury Perfume CEO Man 100ml', brand: 'Bella Vita', pack: '100ml', mrp: 599, price: 499, description: 'Long lasting luxury perfume for men. Fresh woody fragrance.', catSlug: 'fmcg' },
  { name: 'Bella Vita Luxury Perfume Rose Woman 100ml', brand: 'Bella Vita', pack: '100ml', mrp: 599, price: 499, description: 'Premium rose fragrance perfume for women. All-day lasting.', catSlug: 'fmcg' },
  { name: 'Bella Vita Organic Anti Acne Face Wash 150ml', brand: 'Bella Vita', pack: '150ml', mrp: 299, price: 269, description: 'Anti acne face wash with neem, tulsi & tea tree to reduce pimples.', catSlug: 'fmcg' },
  { name: 'Bella Vita Organic Ubtan Face Pack 60g', brand: 'Bella Vita', pack: '60g', mrp: 399, price: 349, description: 'Ubtan face pack with turmeric, saffron & sandalwood for glowing skin.', catSlug: 'cream-ointment' },
  { name: 'Bella Vita Organic Vitamin C Serum 30ml', brand: 'Bella Vita', pack: '30ml', mrp: 499, price: 399, description: 'Vitamin C face serum for brightening, anti-aging and dark spot removal.', catSlug: 'cream-ointment' },
  { name: 'Bella Vita Luxury SKAI Aquatic Unisex Perfume 100ml', brand: 'Bella Vita', pack: '100ml', mrp: 599, price: 499, description: 'SKAI aquatic unisex perfume. Fresh ocean-inspired scent.', catSlug: 'fmcg' },
  { name: 'Bella Vita Organic De-Tan Removal Face Wash 150ml', brand: 'Bella Vita', pack: '150ml', mrp: 299, price: 269, description: 'De-tan face wash with cucumber & lemon for removing sun tan.', catSlug: 'fmcg' },
  { name: 'Bella Vita Organic Retinol Night Cream 50g', brand: 'Bella Vita', pack: '50g', mrp: 499, price: 449, description: 'Retinol night cream for anti-aging, wrinkle reduction and skin repair.', catSlug: 'cream-ointment' },
  { name: 'Bella Vita Luxury Perfume Gift Set (4x20ml)', brand: 'Bella Vita', pack: '4x20ml', mrp: 799, price: 649, description: 'Premium perfume gift set with 4 luxury fragrances. 20ml each.', catSlug: 'fmcg' },
  { name: 'Bella Vita Organic Charcoal Face Wash 150ml', brand: 'Bella Vita', pack: '150ml', mrp: 299, price: 269, description: 'Activated charcoal face wash for deep cleansing and oil control.', catSlug: 'fmcg' },
  { name: 'Bella Vita Organic Rose Body Lotion 200ml', brand: 'Bella Vita', pack: '200ml', mrp: 349, price: 299, description: 'Rose body lotion for deep moisturization and soft skin.', catSlug: 'lotion' },
  { name: 'Bella Vita Luxury FRESH Unisex Perfume 100ml', brand: 'Bella Vita', pack: '100ml', mrp: 599, price: 499, description: 'Fresh unisex perfume with citrus and woody notes.', catSlug: 'fmcg' },
  { name: 'Bella Vita Organic Neem Face Wash 150ml', brand: 'Bella Vita', pack: '150ml', mrp: 299, price: 269, description: 'Neem face wash with aloe vera for acne-free clear skin.', catSlug: 'fmcg' },
  { name: 'Bella Vita Organic Honey Moisturizer Cream 50g', brand: 'Bella Vita', pack: '50g', mrp: 399, price: 349, description: 'Honey moisturizer cream for dry skin. Deep hydration all day.', catSlug: 'cream-ointment' },
  { name: 'Bella Vita Luxury Date Perfume for Women 100ml', brand: 'Bella Vita', pack: '100ml', mrp: 599, price: 499, description: 'Date perfume for women. Warm floral fragrance for evenings.', catSlug: 'fmcg' },
  { name: 'Bella Vita Organic Sunscreen SPF 50 100ml', brand: 'Bella Vita', pack: '100ml', mrp: 399, price: 349, description: 'Sunscreen SPF 50 with PA+++ for UVA/UVB protection. Non-greasy formula.', catSlug: 'cream-ointment' },
  { name: 'Bella Vita Organic Lip Balm Tint (Pack of 3)', brand: 'Bella Vita', pack: '3x5g', mrp: 449, price: 399, description: 'Organic lip balm tint combo. Moisturizes and adds natural colour.', catSlug: 'cream-ointment' },
  { name: 'Bella Vita Organic Hair Growth Oil 200ml', brand: 'Bella Vita', pack: '200ml', mrp: 449, price: 399, description: 'Organic hair growth oil with bhringraj, onion and castor for strong hair.', catSlug: 'fmcg' },
  { name: 'Bella Vita Organic Under Eye Cream 20g', brand: 'Bella Vita', pack: '20g', mrp: 349, price: 299, description: 'Under eye cream for dark circles with cucumber, vitamin E and almond oil.', catSlug: 'cream-ointment' },
];

async function main() {
  console.log('🔧 Seeding Mamaearth & Bella Vita products…');

  // Ensure needed categories exist
  const catCache = {};
  const neededSlugs = new Set([...MAMAEARTH, ...BELLAVITA].map(p => p.catSlug));
  const catNames = { fmcg: 'FMCG', 'cream-ointment': 'Cream & Ointment', lotion: 'Lotion' };
  for (const slug of neededSlugs) {
    catCache[slug] = await ensureCategory(catNames[slug] || slug, slug);
  }

  let inserted = 0;
  for (const p of MAMAEARTH) {
    try {
      await insertProduct(p, catCache[p.catSlug]);
      inserted++;
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') continue;
      console.error(`  ✗ ${p.name}:`, e.message);
    }
  }
  console.log(`  ✓ Mamaearth: ${inserted} products added`);

  let inserted2 = 0;
  for (const p of BELLAVITA) {
    try {
      await insertProduct(p, catCache[p.catSlug]);
      inserted2++;
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') continue;
      console.error(`  ✗ ${p.name}:`, e.message);
    }
  }
  console.log(`  ✓ Bella Vita: ${inserted2} products added`);

  console.log(`✅ Done. Total ${inserted + inserted2} products seeded.`);
  process.exit(0);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
