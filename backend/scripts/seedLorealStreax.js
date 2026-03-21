'use strict';
/**
 * Seed L'Oreal Paris & Streax products into the database.
 * Usage (on server):
 *   cd ~/batla-medicos/backend
 *   source ~/nodevenv/batla-medicos/24/bin/activate
 *   node scripts/seedLorealStreax.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { query, execute } = require('../db/mysql');

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
  return await getCatId(slug);
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
      null,
    ]
  );
}

// ─── L'Oreal Paris Products ────────────────────────────────────────────────
const LOREAL = [
  // Shampoos
  { name: "L'Oreal Paris Extraordinary Clay Shampoo 175ml",       brand: "L'Oreal Paris", pack: '175ml',   mrp: 330,  price: 280,  description: "Shampoo for oily hair with 3 refined clays. Purifies scalp excess oil and rebalances hair.",   catSlug: 'fmcg' },
  { name: "L'Oreal Paris Extraordinary Clay Shampoo 375ml",       brand: "L'Oreal Paris", pack: '375ml',   mrp: 599,  price: 499,  description: "Shampoo for oily hair with 3 refined clays. Purifies scalp excess oil and rebalances hair.",   catSlug: 'fmcg' },
  { name: "L'Oreal Paris Total Repair 5 Shampoo 175ml",           brand: "L'Oreal Paris", pack: '175ml',   mrp: 299,  price: 254,  description: "Repairs 5 signs of damaged hair: breakage, dryness, dullness, roughness and split ends.",       catSlug: 'fmcg' },
  { name: "L'Oreal Paris Total Repair 5 Shampoo 360ml",           brand: "L'Oreal Paris", pack: '360ml',   mrp: 499,  price: 424,  description: "Repairs 5 signs of damaged hair: breakage, dryness, dullness, roughness and split ends.",       catSlug: 'fmcg' },
  { name: "L'Oreal Paris Smooth Intense Shampoo 175ml",           brand: "L'Oreal Paris", pack: '175ml',   mrp: 299,  price: 254,  description: "Anti-frizz shampoo with pro-keratin and silk. Controls frizz for up to 48 hours.",              catSlug: 'fmcg' },
  { name: "L'Oreal Paris Smooth Intense Shampoo 360ml",           brand: "L'Oreal Paris", pack: '360ml',   mrp: 499,  price: 424,  description: "Anti-frizz shampoo with pro-keratin and silk. Controls frizz for up to 48 hours.",              catSlug: 'fmcg' },
  { name: "L'Oreal Paris Dream Long Shampoo 175ml",               brand: "L'Oreal Paris", pack: '175ml',   mrp: 299,  price: 254,  description: "Strengthening shampoo for long, strong hair with castor oil and vitamins B3 and B6.",           catSlug: 'fmcg' },
  { name: "L'Oreal Paris Dream Long Shampoo 360ml",               brand: "L'Oreal Paris", pack: '360ml',   mrp: 499,  price: 424,  description: "Strengthening shampoo for long, strong hair with castor oil and vitamins B3 and B6.",           catSlug: 'fmcg' },
  { name: "L'Oreal Paris Fall Repair 3X Shampoo 180ml",           brand: "L'Oreal Paris", pack: '180ml',   mrp: 249,  price: 212,  description: "Anti-hair fall shampoo with arginine and taurine. Reduces hair fall due to breakage.",           catSlug: 'fmcg' },
  { name: "L'Oreal Paris Fall Repair 3X Shampoo 360ml",           brand: "L'Oreal Paris", pack: '360ml',   mrp: 449,  price: 382,  description: "Anti-hair fall shampoo with arginine and taurine. Reduces hair fall due to breakage.",           catSlug: 'fmcg' },
  { name: "L'Oreal Paris Hyaluron Moisture 72H Shampoo 250ml",    brand: "L'Oreal Paris", pack: '250ml',   mrp: 499,  price: 424,  description: "Moisturising shampoo with hyaluronic acid for dry and dehydrated hair.",                       catSlug: 'fmcg' },
  // Conditioners
  { name: "L'Oreal Paris Total Repair 5 Conditioner 175ml",       brand: "L'Oreal Paris", pack: '175ml',   mrp: 299,  price: 254,  description: "5-in-1 repairing conditioner with Pro-Keratin and ceramide for damaged hair.",                   catSlug: 'fmcg' },
  { name: "L'Oreal Paris Smooth Intense Conditioner 175ml",       brand: "L'Oreal Paris", pack: '175ml',   mrp: 299,  price: 254,  description: "Anti-frizz conditioner with pro-keratin and silk. Leaves hair smooth and manageable.",           catSlug: 'fmcg' },
  { name: "L'Oreal Paris Dream Long Conditioner 175ml",           brand: "L'Oreal Paris", pack: '175ml',   mrp: 299,  price: 254,  description: "Strengthening conditioner for long hair with castor oil.",                                       catSlug: 'fmcg' },
  { name: "L'Oreal Paris Fall Repair 3X Conditioner 175ml",       brand: "L'Oreal Paris", pack: '175ml',   mrp: 249,  price: 212,  description: "Anti-hair fall conditioner with ceramide. Reduces breakage and strengthens hair.",               catSlug: 'fmcg' },
  // Hair Masks / Serums
  { name: "L'Oreal Paris Total Repair 5 Mask 200ml",              brand: "L'Oreal Paris", pack: '200ml',   mrp: 499,  price: 424,  description: "Deep repair mask with pro-keratin and ceramide for 5 signs of damaged hair.",                    catSlug: 'fmcg' },
  { name: "L'Oreal Paris Smooth Intense Hair Mask 200ml",         brand: "L'Oreal Paris", pack: '200ml',   mrp: 499,  price: 424,  description: "Intensive smoothing mask with omega-6 and pro-keratin for frizzy hair.",                         catSlug: 'fmcg' },
  { name: "L'Oreal Paris Dream Long Hair Mask 200ml",             brand: "L'Oreal Paris", pack: '200ml',   mrp: 499,  price: 424,  description: "Nourishing hair mask for long hair with castor oil. Repairs and strengthens hair.",               catSlug: 'fmcg' },
  { name: "L'Oreal Paris 6 Oil Nourish Extraordinary Oil 100ml",  brand: "L'Oreal Paris", pack: '100ml',   mrp: 799,  price: 679,  description: "Nourishing hair oil with 6 flower oils. Transforms dry, dull hair to silky, shiny hair.",        catSlug: 'fmcg' },
  { name: "L'Oreal Paris Smooth Intense Serum 30ml",              brand: "L'Oreal Paris", pack: '30ml',    mrp: 399,  price: 339,  description: "Anti-frizz hair serum with pro-keratin and arginine. Tames frizz and flyaways.",                  catSlug: 'fmcg' },
  { name: "L'Oreal Paris Total Repair 5 Serum 80ml",              brand: "L'Oreal Paris", pack: '80ml',    mrp: 449,  price: 382,  description: "Repairing serum for damaged hair ends with pro-keratin and ceramide.",                           catSlug: 'fmcg' },
  // Hair Colour
  { name: "L'Oreal Paris Casting Creme Gloss 3.16 Plum Black",    brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 599,  price: 509,  description: "Ammonia-free hair colour with glossy finish. Shade: 3.16 Plum Black.",                          catSlug: 'fmcg' },
  { name: "L'Oreal Paris Casting Creme Gloss 4 Brown",            brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 599,  price: 509,  description: "Ammonia-free hair colour with glossy finish. Shade: 4 Brown.",                                  catSlug: 'fmcg' },
  { name: "L'Oreal Paris Casting Creme Gloss 210 Blue Black",     brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 599,  price: 509,  description: "Ammonia-free hair colour with glossy finish. Shade: 210 Blue Black.",                           catSlug: 'fmcg' },
  { name: "L'Oreal Paris Excellence Creme 3 Dark Brown",          brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 549,  price: 467,  description: "Triple protection hair colour with pro-keratin + ceramide. Shade: 3 Dark Brown.",               catSlug: 'fmcg' },
  { name: "L'Oreal Paris Excellence Creme 4 Natural Brown",       brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 549,  price: 467,  description: "Triple protection hair colour with pro-keratin + ceramide. Shade: 4 Natural Brown.",            catSlug: 'fmcg' },
  { name: "L'Oreal Paris Excellence Creme 1 Natural Black",       brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 549,  price: 467,  description: "Triple protection hair colour with pro-keratin + ceramide. Shade: 1 Natural Black.",            catSlug: 'fmcg' },
  // Face Wash
  { name: "L'Oreal Paris Pure Clay Face Wash 100ml",              brand: "L'Oreal Paris", pack: '100ml',   mrp: 399,  price: 339,  description: "Clay face cleanser with eucalyptus pure clay extract. Deeply cleanses and mattifies.",           catSlug: 'fmcg' },
  { name: "L'Oreal Paris Glycolic Bright Face Wash 100ml",        brand: "L'Oreal Paris", pack: '100ml',   mrp: 399,  price: 339,  description: "Face wash with glycolic acid for instant brightness and glow.",                                  catSlug: 'fmcg' },
  // Moisturisers / Cream
  { name: "L'Oreal Paris Revitalift Crystal Micro Essence 130ml", brand: "L'Oreal Paris", pack: '130ml',   mrp: 999,  price: 849,  description: "Face essence with pure salicylic acid. Refines skin texture and gives crystal clear glow.",      catSlug: 'cream-ointment' },
  { name: "L'Oreal Paris Revitalift Day Cream SPF24 50ml",        brand: "L'Oreal Paris", pack: '50ml',    mrp: 799,  price: 679,  description: "Anti-ageing day cream with SPF24 and pro-retinol. Reduces wrinkles and firms skin.",             catSlug: 'cream-ointment' },
  { name: "L'Oreal Paris Glycolic Bright Day Cream SPF17 50ml",   brand: "L'Oreal Paris", pack: '50ml',    mrp: 799,  price: 679,  description: "Brightening day cream with glycolic acid and SPF17. Reduces dark spots in 2 weeks.",            catSlug: 'cream-ointment' },
  { name: "L'Oreal Paris Hyaluron Specialist Moisturiser 50ml",   brand: "L'Oreal Paris", pack: '50ml',    mrp: 599,  price: 509,  description: "Hydrating moisturiser with hyaluronic acid concentrate. Plumps and smoothens skin.",            catSlug: 'cream-ointment' },
  // Serum
  { name: "L'Oreal Paris Revitalift 1.5% Pure Hyaluronic Acid Serum 30ml",    brand: "L'Oreal Paris", pack: '30ml',  mrp: 1299, price: 1104, description: "Face serum with 1.5% pure hyaluronic acid. Hydrates skin for 24 hours and reduces fine lines.", catSlug: 'cream-ointment' },
  { name: "L'Oreal Paris Glycolic Bright Serum 30ml",             brand: "L'Oreal Paris", pack: '30ml',    mrp: 999,  price: 849,  description: "Brightening serum with glycolic acid. Reduces dark spots and evens skin tone.",                  catSlug: 'cream-ointment' },
  // Sunscreen
  { name: "L'Oreal Paris UV Defender SPF50 50ml",                 brand: "L'Oreal Paris", pack: '50ml',    mrp: 799,  price: 679,  description: "Sunscreen with SPF50 PA++++. Protects against UVA and UVB. Lightweight, non-greasy formula.",   catSlug: 'cream-ointment' },
  { name: "L'Oreal Paris Revitalift Crystal Sunscreen SPF65 50ml",brand: "L'Oreal Paris", pack: '50ml',    mrp: 899,  price: 764,  description: "Crystal clear sunscreen with SPF65 and pure glycolic. Lightweight and non-whitening.",          catSlug: 'cream-ointment' },
  // Sheet Masks
  { name: "L'Oreal Paris Pure Clay Mask Purify & Mattify 50ml",   brand: "L'Oreal Paris", pack: '50ml',    mrp: 499,  price: 424,  description: "Clay face mask with eucalyptus to deeply purify and mattify oily skin.",                        catSlug: 'fmcg' },
  { name: "L'Oreal Paris Pure Clay Mask Exfoliate & Refine 50ml", brand: "L'Oreal Paris", pack: '50ml',    mrp: 499,  price: 424,  description: "Clay face mask with red algae extract to exfoliate and refine pores.",                          catSlug: 'fmcg' },
  { name: "L'Oreal Paris Pure Clay Detox Mask 50ml",              brand: "L'Oreal Paris", pack: '50ml',    mrp: 499,  price: 424,  description: "Clay face mask with charcoal to detox and unclog pores.",                                       catSlug: 'fmcg' },
  // Body Lotion
  { name: "L'Oreal Paris Revitalift Body Serum 230ml",            brand: "L'Oreal Paris", pack: '230ml',   mrp: 799,  price: 679,  description: "Body serum with 1.5% hyaluronic acid. Firms and smoothens skin.",                               catSlug: 'lotion' },  // More Hair Colour Shades
  { name: "L'Oreal Paris Excellence Creme 5 Natural Brown",        brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 549,  price: 467,  description: "Triple protection hair colour with pro-keratin + ceramide. Shade: 5 Natural Brown.",         catSlug: 'fmcg' },
  { name: "L'Oreal Paris Excellence Creme 6 Natural Light Brown",  brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 549,  price: 467,  description: "Triple protection hair colour with pro-keratin + ceramide. Shade: 6 Natural Light Brown.",   catSlug: 'fmcg' },
  { name: "L'Oreal Paris Excellence Creme 7 Natural Blonde",       brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 549,  price: 467,  description: "Triple protection hair colour with pro-keratin + ceramide. Shade: 7 Natural Blonde.",        catSlug: 'fmcg' },
  { name: "L'Oreal Paris Excellence Creme 4.62 Dark Maroon",       brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 549,  price: 467,  description: "Triple protection hair colour + ceramide. Shade: 4.62 Dark Maroon. Rich burgundy tone.",     catSlug: 'fmcg' },
  { name: "L'Oreal Paris Excellence Creme 5.62 Red Burgundy",      brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 549,  price: 467,  description: "Triple protection hair colour + ceramide. Shade: 5.62 Red Burgundy. Bold red-wine tone.",    catSlug: 'fmcg' },
  { name: "L'Oreal Paris Excellence Creme 6.45 Copper Mahogany",   brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 549,  price: 467,  description: "Triple protection hair colour + ceramide. Shade: 6.45 Copper Mahogany.",                    catSlug: 'fmcg' },
  { name: "L'Oreal Paris Excellence Creme 3.16 Plum",              brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 549,  price: 467,  description: "Triple protection hair colour + ceramide. Shade: 3.16 Plum. Vibrant fashion shade.",         catSlug: 'fmcg' },
  { name: "L'Oreal Paris Colour Naturals 4 Natural Brown",         brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 249,  price: 212,  description: "Gentle permanent hair colour with milk proteins & honey. Shade: 4 Natural Brown.",            catSlug: 'fmcg' },
  { name: "L'Oreal Paris Colour Naturals 4.62 Dark Maroon",        brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 249,  price: 212,  description: "Gentle permanent hair colour with milk proteins & honey. Shade: 4.62 Dark Maroon.",           catSlug: 'fmcg' },
  { name: "L'Oreal Paris Colour Naturals 5.62 Red Burgundy",       brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 249,  price: 212,  description: "Gentle permanent hair colour with milk proteins & honey. Shade: 5.62 Red Burgundy.",          catSlug: 'fmcg' },
  { name: "L'Oreal Paris Colour Naturals 6.3 Light Golden Brown",  brand: "L'Oreal Paris", pack: '1 Kit',   mrp: 249,  price: 212,  description: "Gentle permanent hair colour with milk proteins & honey. Shade: 6.3 Light Golden Brown.",     catSlug: 'fmcg' },
  // Maybelline (L'Oreal Group)
  { name: "Maybelline Baby Lips Lip Balm Pinkylicious 4g",          brand: 'Maybelline',    pack: '4g',      mrp: 125,  price: 112,  description: "Tinted moisturising lip balm with SPF20. Shade: Pinkylicious. 8-hour moisture.",             catSlug: 'fmcg' },
  { name: "Maybelline Baby Lips Lip Balm Berry Crush 4g",           brand: 'Maybelline',    pack: '4g',      mrp: 125,  price: 112,  description: "Tinted moisturising lip balm with SPF20. Shade: Berry Crush. 8-hour moisture.",             catSlug: 'fmcg' },
  { name: "Maybelline Baby Lips Lip Balm Peach Kiss 4g",            brand: 'Maybelline',    pack: '4g',      mrp: 125,  price: 112,  description: "Tinted moisturising lip balm with SPF20. Shade: Peach Kiss.",                               catSlug: 'fmcg' },
  { name: "Maybelline Fit Me Foundation 220 Natural Beige 30ml",    brand: 'Maybelline',    pack: '30ml',    mrp: 355,  price: 319,  description: "Fit Me matte + poreless foundation. Shade: 220 Natural Beige. Blurs pores.",                catSlug: 'fmcg' },
  { name: "Maybelline Colossal Bold Mascara Black 9.5ml",           brand: 'Maybelline',    pack: '9.5ml',   mrp: 299,  price: 269,  description: "Colossal 9X volume mascara. Enriched with collagen for bold, voluminous lashes.",            catSlug: 'fmcg' },
  { name: "Maybelline New York Hyper Precise Liner Black 0.5ml",    brand: 'Maybelline',    pack: '0.5ml',   mrp: 345,  price: 310,  description: "0.1mm micro-brush liner. Water-resistant, all-day bold black liner.",                       catSlug: 'fmcg' },];

// ─── Streax Products ────────────────────────────────────────────────────────
const STREAX = [
  // Hair Oils
  { name: 'Streax Hair Serum with Walnut Oil 200ml',              brand: 'Streax', pack: '200ml',  mrp: 299,  price: 254,  description: 'Hair serum with walnut oil for instant shine and smooth hair. Controls frizz and flyaways.',         catSlug: 'fmcg' },
  { name: 'Streax Hair Serum with Walnut Oil 100ml',              brand: 'Streax', pack: '100ml',  mrp: 175,  price: 149,  description: 'Hair serum with walnut oil for instant shine and smooth hair.',                                    catSlug: 'fmcg' },
  { name: 'Streax Vitariche Gloss Hair Serum 200ml',              brand: 'Streax', pack: '200ml',  mrp: 335,  price: 285,  description: 'Vitariche gloss hair serum for shiny, frizz-free hair. Enriched with vitamin E.',                  catSlug: 'fmcg' },
  { name: 'Streax Vitariche Gloss Hair Serum 100ml',              brand: 'Streax', pack: '100ml',  mrp: 189,  price: 161,  description: 'Vitariche gloss hair serum for shiny, frizz-free hair. Enriched with vitamin E.',                  catSlug: 'fmcg' },
  { name: 'Streax Pro Series Argan Secret Hair Serum 200ml',      brand: 'Streax Pro', pack: '200ml',mrp: 549, price: 467,  description: 'Argan oil hair serum for intense nourishment and shine. Controls frizz.',                         catSlug: 'fmcg' },
  { name: 'Streax Pro Series Argan Secret Hair Serum 100ml',      brand: 'Streax Pro', pack: '100ml',mrp: 299, price: 254,  description: 'Argan oil hair serum for intense nourishment and shine.',                                        catSlug: 'fmcg' },
  // Hair Cream
  { name: 'Streax Hair Creme With Argan Oil 100ml',               brand: 'Streax', pack: '100ml',  mrp: 175,  price: 149,  description: 'Hair cream with argan oil for smooth, frizz-free hair styling.',                                 catSlug: 'fmcg' },
  { name: 'Streax Hair Creme Extra Hold 100ml',                   brand: 'Streax', pack: '100ml',  mrp: 149,  price: 127,  description: 'Extra hold hair cream for all-day styling. Keeps hair in place.',                               catSlug: 'fmcg' },
  { name: 'Streax Wax It Hair Wax 60g',                           brand: 'Streax', pack: '60g',    mrp: 225,  price: 191,  description: 'Hair wax for strong hold and texture. Gives matte finish.',                                     catSlug: 'fmcg' },
  { name: 'Streax Professional Hair Wax Strong Hold 100g',        brand: 'Streax Pro', pack: '100g',mrp: 399, price: 339,  description: 'Professional hair wax with strong hold. Sculpts and defines hair styles.',                       catSlug: 'fmcg' },
  // Shampoo
  { name: 'Streax Vitariche Shine Shampoo 250ml',                 brand: 'Streax', pack: '250ml',  mrp: 199,  price: 169,  description: 'Shine shampoo with vitamin C and silk proteins for healthy, glossy hair.',                       catSlug: 'fmcg' },
  { name: 'Streax Vitariche Shine Shampoo 500ml',                 brand: 'Streax', pack: '500ml',  mrp: 349,  price: 297,  description: 'Shine shampoo with vitamin C and silk proteins for healthy, glossy hair.',                       catSlug: 'fmcg' },
  { name: 'Streax Pro Sleek Smooth Shampoo 300ml',                brand: 'Streax Pro', pack: '300ml',mrp: 349, price: 297,  description: 'Sleek and smooth shampoo for frizzy hair with argan oil.',                                     catSlug: 'fmcg' },
  { name: 'Streax Pro Restore Nourish Shampoo 300ml',             brand: 'Streax Pro', pack: '300ml',mrp: 349, price: 297,  description: 'Nourishing shampoo for damaged hair with protein and keratin complex.',                        catSlug: 'fmcg' },
  { name: 'Streax Pro Hydra Smooth Shampoo 300ml',                brand: 'Streax Pro', pack: '300ml',mrp: 349, price: 297,  description: 'Hydrating shampoo for dry hair with hyaluronic acid and silk proteins.',                       catSlug: 'fmcg' },
  // Conditioner
  { name: 'Streax Vitariche Shine Conditioner 250ml',             brand: 'Streax', pack: '250ml',  mrp: 199,  price: 169,  description: 'Shine conditioner with vitamin C and silk proteins. Adds shine and softness.',                  catSlug: 'fmcg' },
  { name: 'Streax Pro Sleek Smooth Conditioner 300ml',            brand: 'Streax Pro', pack: '300ml',mrp: 349, price: 297,  description: 'Smoothing conditioner for frizzy hair with argan oil.',                                       catSlug: 'fmcg' },
  { name: 'Streax Pro Restore Nourish Conditioner 300ml',         brand: 'Streax Pro', pack: '300ml',mrp: 349, price: 297,  description: 'Nourishing conditioner for damaged hair with protein and keratin.',                           catSlug: 'fmcg' },
  // Hair Mask
  { name: 'Streax Pro Argan Secret Hair Mask 200g',               brand: 'Streax Pro', pack: '200g',mrp: 499, price: 424,  description: 'Deep argan oil hair mask for intense nourishment and frizz control.',                          catSlug: 'fmcg' },
  { name: 'Streax Pro Serie Expert Restore Mask 200g',            brand: 'Streax Pro', pack: '200g',mrp: 549, price: 467,  description: 'Expert restore hair mask for damaged hair with amino acids and ceramide.',                     catSlug: 'fmcg' },
  // Hair Colour
  { name: 'Streax Ultralights Highlighting Kit Natural Blondes',  brand: 'Streax', pack: '1 Kit',  mrp: 379,  price: 322,  description: 'Hair highlighting kit for natural blondes. Gives luminous highlights at home.',                catSlug: 'fmcg' },
  { name: 'Streax Ultralights Highlighting Kit Cool Ash',         brand: 'Streax', pack: '1 Kit',  mrp: 379,  price: 322,  description: 'Hair highlighting kit for cool ash shades. Gives salon-like highlights.',                     catSlug: 'fmcg' },
  { name: 'Streax Ultralights Highlighting Kit Light Copper',     brand: 'Streax', pack: '1 Kit',  mrp: 379,  price: 322,  description: 'Hair highlighting kit for light copper shade. Vibrant and long-lasting.',                    catSlug: 'fmcg' },
  { name: 'Streax Hair Colour BlackOut Black',                    brand: 'Streax', pack: '1 Kit',  mrp: 299,  price: 254,  description: 'Blackout black hair colour with 100% grey coverage. Lasts up to 12 washes.',                  catSlug: 'fmcg' },
  { name: 'Streax Hair Colour Natural Dark Brown',                brand: 'Streax', pack: '1 Kit',  mrp: 299,  price: 254,  description: 'Natural dark brown hair colour with 100% grey coverage.',                                    catSlug: 'fmcg' },
  { name: 'Streax Hair Colour Light Brown',                       brand: 'Streax', pack: '1 Kit',  mrp: 299,  price: 254,  description: 'Light brown hair colour. Covers grey completely with natural looking colour.',               catSlug: 'fmcg' },
  // Gel
  { name: 'Streax Hair Gel Wet Look 250ml',                       brand: 'Streax', pack: '250ml',  mrp: 175,  price: 149,  description: 'Wet look hair gel for all day hold. Gives a shiny, wet appearance.',                          catSlug: 'fmcg' },
  { name: 'Streax Hair Gel Wet Look 500ml',                       brand: 'Streax', pack: '500ml',  mrp: 299,  price: 254,  description: 'Wet look hair gel for all day hold. Gives a shiny, wet appearance.',                          catSlug: 'fmcg' },
  { name: 'Streax Xpert Ultra Hold Hair Gel 250ml',               brand: 'Streax', pack: '250ml',  mrp: 199,  price: 169,  description: 'Ultra hold hair gel for extreme styling. Long-lasting, non-sticky.',                         catSlug: 'fmcg' },
  { name: 'Streax Pro Firm Hold Gel 250ml',                       brand: 'Streax Pro', pack: '250ml',mrp: 299, price: 254,  description: 'Professional firm hold gel for sculpted styles. Alcohol-free.',                             catSlug: 'fmcg' },
  // Spray
  { name: 'Streax Pro Hair Spray Extra Hold 250ml',               brand: 'Streax Pro', pack: '250ml',mrp: 399, price: 339,  description: 'Extra hold hair spray for long-lasting styles. UV protection.',                             catSlug: 'fmcg' },
  { name: 'Streax Pro Hair Spray Flexible Hold 250ml',            brand: 'Streax Pro', pack: '250ml',mrp: 399, price: 339,  description: 'Flexible hold hair spray for natural movement and volume.',                               catSlug: 'fmcg' },
  // Smoothening / Treatment
  { name: 'Streax Pro Reconstructor Treatment 200ml',             brand: 'Streax Pro', pack: '200ml',mrp: 549, price: 467,  description: 'Protein reconstructor treatment for chemically treated and damaged hair.',                  catSlug: 'fmcg' },
  { name: 'Streax Pro Keratin Serum 100ml',                       brand: 'Streax Pro', pack: '100ml',mrp: 499, price: 424,  description: 'Keratin smoothening serum for frizzy, unruly hair. Locks in moisture.',                    catSlug: 'fmcg' },
  // Oil
  { name: 'Streax Coconut Hair Oil 200ml',                        brand: 'Streax', pack: '200ml',  mrp: 149,  price: 127,  description: 'Coconut hair oil for nourishment and hair growth. Reduces hair fall.',                       catSlug: 'fmcg' },
  { name: 'Streax Cool Hair Oil 300ml',                           brand: 'Streax', pack: '300ml',  mrp: 175,  price: 149,  description: 'Cool hair oil with menthol and coconut. Cools scalp and reduces itchiness.',                catSlug: 'fmcg' },
  { name: 'Streax Jasmine Hair Oil 200ml',                        brand: 'Streax', pack: '200ml',  mrp: 149,  price: 127,  description: 'Jasmine scented hair oil for nourishment and shine. Strengthens hair roots.',              catSlug: 'fmcg' },
  { name: 'Streax Pro Argan Secret Hair Oil 200ml',               brand: 'Streax Pro', pack: '200ml',mrp: 499, price: 424,  description: 'Premium argan oil hair oil for deep nourishment and frizz control.',                      catSlug: 'fmcg' },
  // Combo Packs
  { name: 'Streax Serum + Shampoo Combo Pack',                    brand: 'Streax', pack: '1 Combo',mrp: 449,  price: 382,  description: 'Combo pack of Streax hair serum and shine shampoo for complete hair care.',               catSlug: 'fmcg' },
  { name: 'Streax Pro Argan Serum + Mask Combo',                  brand: 'Streax Pro', pack: '1 Combo',mrp: 999, price: 849, description: 'Combo pack of Streax Pro argan serum and hair mask for intense repair.',                catSlug: 'fmcg' },
  { name: 'Streax Hair Colour + Serum Combo',                     brand: 'Streax', pack: '1 Combo',mrp: 549,  price: 467,  description: 'Combo pack of Streax hair colour and serum for coloured hair care.',                     catSlug: 'fmcg' },
  // More Hair Colour Shades
  { name: 'Streax Hair Colour 1 Black',                          brand: 'Streax', pack: '1 Kit',  mrp: 99,   price: 89,   description: 'Permanent hair colour with Insta Smooth conditioner. Shade: 1 Black. 100% grey coverage.', catSlug: 'fmcg' },
  { name: 'Streax Hair Colour 2 Brown',                          brand: 'Streax', pack: '1 Kit',  mrp: 99,   price: 89,   description: 'Permanent hair colour. Shade: 2 Brown. Rich, natural colour with luminous shine.',         catSlug: 'fmcg' },
  { name: 'Streax Hair Colour 3 Darkest Brown',                  brand: 'Streax', pack: '1 Kit',  mrp: 99,   price: 89,   description: 'Permanent hair colour. Shade: 3 Darkest Brown. Deep colour with complete coverage.',       catSlug: 'fmcg' },
  { name: 'Streax Hair Colour 4 Natural Brown',                  brand: 'Streax', pack: '1 Kit',  mrp: 99,   price: 89,   description: 'Permanent hair colour. Shade: 4 Natural Brown. Lustrous natural brown tones.',            catSlug: 'fmcg' },
  { name: 'Streax Hair Colour 4.65 Burgundy',                    brand: 'Streax', pack: '1 Kit',  mrp: 99,   price: 89,   description: 'Permanent hair colour. Shade: 4.65 Burgundy. Deep red-violet fashion shade.',             catSlug: 'fmcg' },
  { name: 'Streax Hair Colour 5 Light Brown',                    brand: 'Streax', pack: '1 Kit',  mrp: 99,   price: 89,   description: 'Permanent hair colour. Shade: 5 Light Brown. Warm medium brown.',                        catSlug: 'fmcg' },
  { name: 'Streax Hair Colour 5.3 Golden Brown',                 brand: 'Streax', pack: '1 Kit',  mrp: 99,   price: 89,   description: 'Permanent hair colour. Shade: 5.3 Golden Brown. Warm golden-brown luminosity.',           catSlug: 'fmcg' },
  { name: 'Streax Hair Colour 6 Dark Blonde',                    brand: 'Streax', pack: '1 Kit',  mrp: 99,   price: 89,   description: 'Permanent hair colour. Shade: 6 Dark Blonde. Natural-looking lighter brunette tones.',   catSlug: 'fmcg' },
  { name: 'Streax Hair Colour 6.4 Copper',                       brand: 'Streax', pack: '1 Kit',  mrp: 99,   price: 89,   description: 'Permanent hair colour. Shade: 6.4 Copper. Vivid copper-orange fashion colour.',           catSlug: 'fmcg' },
  { name: 'Streax Hair Colour 6.65 Red',                         brand: 'Streax', pack: '1 Kit',  mrp: 99,   price: 89,   description: 'Permanent hair colour. Shade: 6.65 Red. Vibrant, fashion-forward red shade.',            catSlug: 'fmcg' },
  { name: 'Streax Hair Colour 7 Medium Blonde',                  brand: 'Streax', pack: '1 Kit',  mrp: 99,   price: 89,   description: 'Permanent hair colour. Shade: 7 Medium Blonde. Natural blonde with warm reflect.',       catSlug: 'fmcg' },
  { name: 'Streax Hair Colour 7.3 Golden Blonde',                brand: 'Streax', pack: '1 Kit',  mrp: 99,   price: 89,   description: 'Permanent hair colour. Shade: 7.3 Golden Blonde. Sunny, warm golden blonde.',            catSlug: 'fmcg' },
  { name: 'Streax Insta Smooth Conditioner Sachet 8ml',          brand: 'Streax', pack: '8ml sachet',mrp:10, price: 9,   description: 'Post-colour instant smooth conditioner. Restores moisture and adds shine.',              catSlug: 'fmcg' },
];

async function run() {
  console.log('\n🚀 Seeding L\'Oreal Paris & Streax products...\n');

  // Ensure the fmcg category exists (used for most cosmetics)
  const fmcgId     = await ensureCategory('FMCG', 'fmcg');
  const creamId    = await ensureCategory('Cream & Ointment', 'cream-ointment');
  const lotionId   = await ensureCategory('Lotion', 'lotion');

  const catMap = { 'fmcg': fmcgId, 'cream-ointment': creamId, 'lotion': lotionId };

  // Insert L'Oreal
  let lCount = 0;
  for (const p of LOREAL) {
    const catId = catMap[p.catSlug] || fmcgId;
    await insertProduct(p, catId);
    lCount++;
    process.stdout.write(`\r  L'Oreal: ${lCount}/${LOREAL.length}`);
  }
  console.log(`\n  ✓ L'Oreal Paris: ${lCount} products added`);

  // Insert Streax
  let sCount = 0;
  for (const p of STREAX) {
    const catId = catMap[p.catSlug] || fmcgId;
    await insertProduct(p, catId);
    sCount++;
    process.stdout.write(`\r  Streax: ${sCount}/${STREAX.length}`);
  }
  console.log(`\n  ✓ Streax: ${sCount} products added`);

  console.log(`\n✅ Done. Total ${lCount + sCount} products seeded.\n`);
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
