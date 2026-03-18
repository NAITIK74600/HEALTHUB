'use strict';
/**
 * Seed products for: Cetaphil, Dermaco, Dermatouch, Durex, Manforce, Skore,
 * Dettol, Mankind, Himalaya, Dabur, Hair & Care
 * Usage: node backend/scripts/seedAllBrands.js
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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CETAPHIL                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */
const CETAPHIL = [
  { name: 'Cetaphil Gentle Skin Cleanser 125ml', brand: 'Cetaphil', pack: '125ml', mrp: 350, price: 315, description: 'Mild, soap-free cleanser for sensitive skin. Non-comedogenic and fragrance-free.', catSlug: 'fmcg' },
  { name: 'Cetaphil Gentle Skin Cleanser 250ml', brand: 'Cetaphil', pack: '250ml', mrp: 605, price: 544, description: 'Soap-free cleanser for all skin types including sensitive skin. Dermatologist recommended.', catSlug: 'fmcg' },
  { name: 'Cetaphil Gentle Skin Cleanser 500ml', brand: 'Cetaphil', pack: '500ml', mrp: 1050, price: 945, description: 'Family size gentle skin cleanser. Ideal for daily face and body cleansing.', catSlug: 'fmcg' },
  { name: 'Cetaphil Moisturising Cream 80g', brand: 'Cetaphil', pack: '80g', mrp: 375, price: 337, description: 'Rich moisturising cream for dry to very dry sensitive skin. Non-greasy formula.', catSlug: 'cream-ointment' },
  { name: 'Cetaphil Moisturising Cream 250g', brand: 'Cetaphil', pack: '250g', mrp: 850, price: 765, description: 'Clinically proven moisturiser for chronic dry skin. Provides 24-hour hydration.', catSlug: 'cream-ointment' },
  { name: 'Cetaphil Moisturising Lotion 200ml', brand: 'Cetaphil', pack: '200ml', mrp: 530, price: 477, description: 'Lightweight body and face lotion for all skin types. Fast-absorbing, non-greasy.', catSlug: 'lotion' },
  { name: 'Cetaphil Moisturising Lotion 500ml', brand: 'Cetaphil', pack: '500ml', mrp: 1100, price: 990, description: 'Daily moisturising lotion with sweet almond oil and vitamin E.', catSlug: 'lotion' },
  { name: 'Cetaphil Oily Skin Cleanser 125ml', brand: 'Cetaphil', pack: '125ml', mrp: 350, price: 315, description: 'Specially formulated for oily and combination skin. Removes excess oil without over-drying.', catSlug: 'fmcg' },
  { name: 'Cetaphil DAM Daily Advance Moisturising Lotion 100g', brand: 'Cetaphil', pack: '100g', mrp: 425, price: 382, description: 'Advanced moisturizing lotion with shea butter and macadamia nut oil for very dry skin.', catSlug: 'lotion' },
  { name: 'Cetaphil Sun SPF 50+ Light Gel 50ml', brand: 'Cetaphil', pack: '50ml', mrp: 960, price: 864, description: 'Lightweight sunscreen gel with broad spectrum SPF 50+ UVA/UVB protection.', catSlug: 'cream-ointment' },
  { name: 'Cetaphil Sun SPF 50+ Light Gel 100ml', brand: 'Cetaphil', pack: '100ml', mrp: 1600, price: 1440, description: 'Non-greasy sunscreen with Mexoryl SX/XL. Water resistant, suitable for sensitive skin.', catSlug: 'cream-ointment' },
  { name: 'Cetaphil Bright Healthy Radiance Brightness Reveal Creamy Cleanser 100g', brand: 'Cetaphil', pack: '100g', mrp: 599, price: 539, description: 'Creamy cleanser with niacinamide, sea daffodil and vitamin C complex for radiant skin.', catSlug: 'fmcg' },
  { name: 'Cetaphil Bright Healthy Radiance Brightening Day Protection Cream SPF15 50g', brand: 'Cetaphil', pack: '50g', mrp: 999, price: 899, description: 'Day cream with SPF 15 for brightening and protection against UV damage.', catSlug: 'cream-ointment' },
  { name: 'Cetaphil Bright Healthy Radiance Brightening Night Comfort Cream 50g', brand: 'Cetaphil', pack: '50g', mrp: 999, price: 899, description: 'Night cream with niacinamide to brighten skin and reduce dark spots while you sleep.', catSlug: 'cream-ointment' },
  { name: 'Cetaphil Bright Healthy Radiance Perfecting Serum 30ml', brand: 'Cetaphil', pack: '30ml', mrp: 1299, price: 1169, description: 'Brightening serum with 2% niacinamide for even-toned radiant skin.', catSlug: 'cream-ointment' },
  { name: 'Cetaphil Baby Daily Lotion 400ml', brand: 'Cetaphil', pack: '400ml', mrp: 799, price: 719, description: 'Gentle daily lotion for baby with organic calendula. Hypoallergenic and paraben-free.', catSlug: 'lotion' },
  { name: 'Cetaphil Baby Gentle Wash & Shampoo 230ml', brand: 'Cetaphil', pack: '230ml', mrp: 549, price: 494, description: 'Tear-free 2-in-1 baby wash and shampoo. Dermatologist tested.', catSlug: 'fmcg' },
  { name: 'Cetaphil Baby Diaper Cream 70g', brand: 'Cetaphil', pack: '70g', mrp: 399, price: 359, description: 'Soothing diaper cream with zinc oxide. Protects and prevents diaper rash.', catSlug: 'cream-ointment' },
  { name: 'Cetaphil PRO Acne Prone Oil Control Foam Wash 236ml', brand: 'Cetaphil', pack: '236ml', mrp: 1190, price: 1071, description: 'Oil control foam wash for acne-prone skin with zinc technology.', catSlug: 'fmcg' },
  { name: 'Cetaphil Eye Gel Cream 14ml', brand: 'Cetaphil', pack: '14ml', mrp: 1099, price: 989, description: 'Hydrating eye gel cream to reduce dark circles and puffiness. With hyaluronic acid.', catSlug: 'cream-ointment' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DERMACO                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
const DERMACO = [
  { name: 'DermaCo 1% Salicylic Acid Gel Face Wash 100ml', brand: 'DermaCo', pack: '100ml', mrp: 349, price: 314, description: 'Salicylic acid gel face wash for acne and excess oil control.', catSlug: 'fmcg' },
  { name: 'DermaCo 2% Salicylic Acid Serum 30ml', brand: 'DermaCo', pack: '30ml', mrp: 499, price: 449, description: 'Targets active acne, blackheads and whiteheads with 2% salicylic acid.', catSlug: 'cream-ointment' },
  { name: 'DermaCo 1% Hyaluronic Acid Sunscreen SPF 50 50g', brand: 'DermaCo', pack: '50g', mrp: 499, price: 449, description: 'Lightweight sunscreen with hyaluronic acid for hydration and UV protection.', catSlug: 'cream-ointment' },
  { name: 'DermaCo 10% Vitamin C Face Serum 30ml', brand: 'DermaCo', pack: '30ml', mrp: 599, price: 539, description: '10% vitamin C serum for brightening, anti-aging and dark spot reduction.', catSlug: 'cream-ointment' },
  { name: 'DermaCo 2% Niacinamide Moisturizer 50g', brand: 'DermaCo', pack: '50g', mrp: 449, price: 404, description: 'Oil-free moisturizer with niacinamide for pore minimizing and oil control.', catSlug: 'cream-ointment' },
  { name: 'DermaCo AHA BHA 10% Face Serum 30ml', brand: 'DermaCo', pack: '30ml', mrp: 599, price: 539, description: 'Chemical exfoliating serum with AHA + BHA for smooth, clear skin.', catSlug: 'cream-ointment' },
  { name: 'DermaCo 1% Retinol Face Serum 30ml', brand: 'DermaCo', pack: '30ml', mrp: 649, price: 584, description: 'Retinol serum for anti-aging, wrinkle reduction and skin renewal.', catSlug: 'cream-ointment' },
  { name: 'DermaCo 2% Kojic Acid Face Cream 30g', brand: 'DermaCo', pack: '30g', mrp: 449, price: 404, description: 'Kojic acid cream for pigmentation, dark spots and uneven skin tone.', catSlug: 'cream-ointment' },
  { name: 'DermaCo Anti-Acne Combo Kit', brand: 'DermaCo', pack: '1 Kit', mrp: 999, price: 849, description: 'Complete anti-acne kit with face wash, serum and moisturizer.', catSlug: 'fmcg' },
  { name: 'DermaCo 1% Ceramide Complex Moisturizer 50g', brand: 'DermaCo', pack: '50g', mrp: 499, price: 449, description: 'Ceramide moisturizer for skin barrier repair and deep hydration.', catSlug: 'cream-ointment' },
  { name: 'DermaCo 5% Cica Complex Moisturizer 50g', brand: 'DermaCo', pack: '50g', mrp: 499, price: 449, description: 'Cica complex moisturizer for soothing irritated and inflamed skin.', catSlug: 'cream-ointment' },
  { name: 'DermaCo 1% Collagen Face Cream 50g', brand: 'DermaCo', pack: '50g', mrp: 549, price: 494, description: 'Collagen face cream for firm, plump and youthful-looking skin.', catSlug: 'cream-ointment' },
  { name: 'DermaCo Pore Minimizing Toner 150ml', brand: 'DermaCo', pack: '150ml', mrp: 449, price: 404, description: 'Alcohol-free toner with niacinamide for pore tightening and oil control.', catSlug: 'fmcg' },
  { name: 'DermaCo Ultra Matte Sunscreen Gel SPF 60 50g', brand: 'DermaCo', pack: '50g', mrp: 599, price: 539, description: 'Ultra matte finish sunscreen gel with SPF 60 PA++++. No white cast.', catSlug: 'cream-ointment' },
  { name: 'DermaCo 10% Azelaic Acid Cream 30g', brand: 'DermaCo', pack: '30g', mrp: 549, price: 494, description: 'Azelaic acid cream for acne marks, hyperpigmentation and rosacea.', catSlug: 'cream-ointment' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DERMATOUCH                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */
const DERMATOUCH = [
  { name: 'Dermatouch Anti-Acne Face Serum 30ml', brand: 'Dermatouch', pack: '30ml', mrp: 599, price: 539, description: 'Anti-acne serum with salicylic acid and tea tree oil for clear skin.', catSlug: 'cream-ointment' },
  { name: 'Dermatouch Sunscreen Gel SPF 50 50g', brand: 'Dermatouch', pack: '50g', mrp: 499, price: 449, description: 'Lightweight sunscreen gel with broad spectrum SPF 50 PA+++.', catSlug: 'cream-ointment' },
  { name: 'Dermatouch Vitamin C Face Serum 30ml', brand: 'Dermatouch', pack: '30ml', mrp: 599, price: 539, description: 'Vitamin C serum for brightening and dark spot correction.', catSlug: 'cream-ointment' },
  { name: 'Dermatouch AHA BHA Face Wash 100ml', brand: 'Dermatouch', pack: '100ml', mrp: 399, price: 359, description: 'AHA + BHA face wash for gentle exfoliation and unclogging pores.', catSlug: 'fmcg' },
  { name: 'Dermatouch Retinol Anti-Aging Serum 30ml', brand: 'Dermatouch', pack: '30ml', mrp: 699, price: 629, description: 'Retinol serum for fine lines, wrinkles and skin rejuvenation.', catSlug: 'cream-ointment' },
  { name: 'Dermatouch Hyaluronic Acid Moisturizer 50g', brand: 'Dermatouch', pack: '50g', mrp: 499, price: 449, description: 'Hyaluronic acid moisturizer for intense hydration and plump skin.', catSlug: 'cream-ointment' },
  { name: 'Dermatouch Niacinamide Face Serum 30ml', brand: 'Dermatouch', pack: '30ml', mrp: 549, price: 494, description: 'Niacinamide serum for oil control, pore minimizing and even skin tone.', catSlug: 'cream-ointment' },
  { name: 'Dermatouch Under Eye Cream 20g', brand: 'Dermatouch', pack: '20g', mrp: 449, price: 404, description: 'Under eye cream for dark circles, puffiness and fine lines.', catSlug: 'cream-ointment' },
  { name: 'Dermatouch Charcoal Peel Off Mask 60g', brand: 'Dermatouch', pack: '60g', mrp: 399, price: 359, description: 'Activated charcoal peel-off mask for blackhead removal and deep cleansing.', catSlug: 'cream-ointment' },
  { name: 'Dermatouch Keratin Hair Serum 50ml', brand: 'Dermatouch', pack: '50ml', mrp: 499, price: 449, description: 'Keratin hair serum for frizz control, smoothness and shine.', catSlug: 'fmcg' },
  { name: 'Dermatouch Salicylic Acid Body Wash 200ml', brand: 'Dermatouch', pack: '200ml', mrp: 449, price: 404, description: 'Body wash with salicylic acid for body acne and rough skin.', catSlug: 'fmcg' },
  { name: 'Dermatouch Glycolic Acid Toner 150ml', brand: 'Dermatouch', pack: '150ml', mrp: 449, price: 404, description: 'Glycolic acid toner for gentle exfoliation and bright skin.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DUREX                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */
const DUREX = [
  { name: 'Durex Extra Thin Condoms (Pack of 10)', brand: 'Durex', pack: '10 pcs', mrp: 200, price: 180, description: 'Ultra-thin condoms for enhanced sensitivity and pleasure.', catSlug: 'fmcg' },
  { name: 'Durex Air Condoms (Pack of 10)', brand: 'Durex', pack: '10 pcs', mrp: 250, price: 225, description: 'Thinnest Durex condoms ever. Maximum sensitivity with reliable protection.', catSlug: 'fmcg' },
  { name: 'Durex Extra Dotted Condoms (Pack of 10)', brand: 'Durex', pack: '10 pcs', mrp: 200, price: 180, description: 'Dotted condoms for extra stimulation. Raised dots for enhanced pleasure.', catSlug: 'fmcg' },
  { name: 'Durex Invisible Extra Thin Condoms (Pack of 10)', brand: 'Durex', pack: '10 pcs', mrp: 350, price: 315, description: 'Invisible condoms — designed to feel like nothing at all. Ultra thin and lubricated.', catSlug: 'fmcg' },
  { name: 'Durex Mutual Pleasure Condoms (Pack of 10)', brand: 'Durex', pack: '10 pcs', mrp: 250, price: 225, description: 'Ribbed and dotted for mutual stimulation and pleasure.', catSlug: 'fmcg' },
  { name: 'Durex Extra Time Condoms (Pack of 10)', brand: 'Durex', pack: '10 pcs', mrp: 250, price: 225, description: 'Condoms with delay lubricant (5% benzocaine) for extended pleasure.', catSlug: 'fmcg' },
  { name: 'Durex Real Feel Condoms (Pack of 10)', brand: 'Durex', pack: '10 pcs', mrp: 300, price: 270, description: 'Non-latex condoms made from polyisoprene for a natural skin-on-skin feel.', catSlug: 'fmcg' },
  { name: 'Durex Pleasure Max Condoms (Pack of 10)', brand: 'Durex', pack: '10 pcs', mrp: 200, price: 180, description: 'Ribbed and contoured condoms for maximum pleasure for both partners.', catSlug: 'fmcg' },
  { name: 'Durex Tropical Flavoured Condoms (Pack of 12)', brand: 'Durex', pack: '12 pcs', mrp: 250, price: 225, description: 'Assorted tropical fruit flavoured condoms. Fun and fruity with reliable protection.', catSlug: 'fmcg' },
  { name: 'Durex Play Lube Tingling 50ml', brand: 'Durex', pack: '50ml', mrp: 250, price: 225, description: 'Tingling lubricant gel for exciting intimate experiences.', catSlug: 'fmcg' },
  { name: 'Durex Play Massage 2-in-1 Sensual 200ml', brand: 'Durex', pack: '200ml', mrp: 499, price: 449, description: '2-in-1 massage & lubricant with ylang ylang for sensual massage.', catSlug: 'fmcg' },
  { name: 'Durex Extra Thin Bubblegum Flavoured Condoms (Pack of 10)', brand: 'Durex', pack: '10 pcs', mrp: 200, price: 180, description: 'Extra thin condoms with bubblegum flavour for fun and protection.', catSlug: 'fmcg' },
  { name: 'Durex Kohinoor Condoms Silky Chocolate (Pack of 10)', brand: 'Durex', pack: '10 pcs', mrp: 120, price: 108, description: 'Chocolate flavoured condoms for an indulgent experience.', catSlug: 'fmcg' },
  { name: 'Durex Kohinoor Condoms Juicy Strawberry (Pack of 10)', brand: 'Durex', pack: '10 pcs', mrp: 120, price: 108, description: 'Strawberry flavoured condoms. Electronically tested for safety.', catSlug: 'fmcg' },
  { name: 'Durex Combo Pack Assorted (Pack of 30)', brand: 'Durex', pack: '30 pcs', mrp: 599, price: 539, description: 'Assorted combo of 30 condoms — thin, dotted, ribbed. Best of Durex.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MANFORCE                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */
const MANFORCE = [
  { name: 'Manforce Wild Strawberry Flavoured Condoms (Pack of 10)', brand: 'Manforce', pack: '10 pcs', mrp: 100, price: 90, description: 'Strawberry flavoured dotted condoms for added excitement.', catSlug: 'fmcg' },
  { name: 'Manforce Chocolate Flavoured Condoms (Pack of 10)', brand: 'Manforce', pack: '10 pcs', mrp: 100, price: 90, description: 'Chocolate flavoured condoms with dotted texture for pleasure.', catSlug: 'fmcg' },
  { name: 'Manforce 3-in-1 Wild Ribbed Dotted Contoured Condoms (Pack of 10)', brand: 'Manforce', pack: '10 pcs', mrp: 120, price: 108, description: '3-in-1 condoms with ribs, dots and contoured shape for maximum stimulation.', catSlug: 'fmcg' },
  { name: 'Manforce Extra Dotted Litchi Flavoured Condoms (Pack of 10)', brand: 'Manforce', pack: '10 pcs', mrp: 100, price: 90, description: 'Litchi flavoured condoms with extra dots for heightened pleasure.', catSlug: 'fmcg' },
  { name: 'Manforce Ultra Thin Jasmine Flavoured Condoms (Pack of 10)', brand: 'Manforce', pack: '10 pcs', mrp: 120, price: 108, description: 'Ultra thin condoms with jasmine fragrance for intimate moments.', catSlug: 'fmcg' },
  { name: 'Manforce Staylong Orange Flavoured Condoms (Pack of 10)', brand: 'Manforce', pack: '10 pcs', mrp: 150, price: 135, description: 'Staylong condoms with benzocaine for extended performance.', catSlug: 'fmcg' },
  { name: 'Manforce Cocktail Condoms (Pack of 10)', brand: 'Manforce', pack: '10 pcs', mrp: 150, price: 135, description: 'Condoms with dual-flavour cocktail combination. Chocolate-hazelnut and vanilla.', catSlug: 'fmcg' },
  { name: 'Manforce Game Condoms (Pack of 10)', brand: 'Manforce', pack: '10 pcs', mrp: 150, price: 135, description: 'Dotted and ribbed condoms for extra friction and excitement.', catSlug: 'fmcg' },
  { name: 'Manforce Bold Panther Condoms Extra Dotted (Pack of 10)', brand: 'Manforce', pack: '10 pcs', mrp: 100, price: 90, description: 'Extra dotted panther condoms for intense stimulation.', catSlug: 'fmcg' },
  { name: 'Manforce Staylong Pineapple Flavoured Condoms (Pack of 10)', brand: 'Manforce', pack: '10 pcs', mrp: 150, price: 135, description: 'Staylong pineapple flavoured condoms for prolonged pleasure.', catSlug: 'fmcg' },
  { name: 'Manforce Xotic Combo Pack (Pack of 20)', brand: 'Manforce', pack: '20 pcs', mrp: 250, price: 225, description: 'Assorted combo pack with multiple flavours and textures.', catSlug: 'fmcg' },
  { name: 'Manforce Extra Dotted Butterscotch Condoms (Pack of 10)', brand: 'Manforce', pack: '10 pcs', mrp: 100, price: 90, description: 'Butterscotch flavoured extra dotted condoms for fun and protection.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SKORE                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */
const SKORE = [
  { name: 'Skore Champion Dotted Condoms (Pack of 10)', brand: 'Skore', pack: '10 pcs', mrp: 100, price: 90, description: 'Dotted condoms for extra pleasure. Electronically tested.', catSlug: 'fmcg' },
  { name: 'Skore Climax Delay Condoms (Pack of 10)', brand: 'Skore', pack: '10 pcs', mrp: 150, price: 135, description: 'Delay condoms with benzocaine gel for longer lasting performance.', catSlug: 'fmcg' },
  { name: 'Skore Strawberry Flavoured Condoms (Pack of 10)', brand: 'Skore', pack: '10 pcs', mrp: 100, price: 90, description: 'Strawberry flavoured condoms for a sweet and fun experience.', catSlug: 'fmcg' },
  { name: 'Skore Warm Condoms (Pack of 10)', brand: 'Skore', pack: '10 pcs', mrp: 150, price: 135, description: 'Warming lubricant condoms for a uniquely warm sensation.', catSlug: 'fmcg' },
  { name: 'Skore Cool Condoms (Pack of 10)', brand: 'Skore', pack: '10 pcs', mrp: 150, price: 135, description: 'Cooling effect condoms with menthol for a refreshing experience.', catSlug: 'fmcg' },
  { name: 'Skore Not Out Condoms (Pack of 10)', brand: 'Skore', pack: '10 pcs', mrp: 150, price: 135, description: 'Climax delay condoms for extended pleasure. With 5% benzocaine.', catSlug: 'fmcg' },
  { name: 'Skore Thin Condoms (Pack of 10)', brand: 'Skore', pack: '10 pcs', mrp: 120, price: 108, description: 'Ultra thin condoms for maximum sensitivity and natural feel.', catSlug: 'fmcg' },
  { name: 'Skore Banana Flavoured Condoms (Pack of 10)', brand: 'Skore', pack: '10 pcs', mrp: 100, price: 90, description: 'Banana flavoured condoms for a fruity twist.', catSlug: 'fmcg' },
  { name: 'Skore Orange Flavoured Condoms (Pack of 10)', brand: 'Skore', pack: '10 pcs', mrp: 100, price: 90, description: 'Orange flavoured condoms for an exciting citrus experience.', catSlug: 'fmcg' },
  { name: 'Skore Combo Pack Assorted (Pack of 20)', brand: 'Skore', pack: '20 pcs', mrp: 250, price: 225, description: 'Assorted combo with dotted, flavoured, thin and delay variants.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DETTOL                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */
const DETTOL = [
  { name: 'Dettol Antiseptic Liquid 125ml', brand: 'Dettol', pack: '125ml', mrp: 72, price: 65, description: 'Antiseptic disinfectant liquid for first aid, cuts, wounds and personal hygiene.', catSlug: 'liquids' },
  { name: 'Dettol Antiseptic Liquid 250ml', brand: 'Dettol', pack: '250ml', mrp: 130, price: 117, description: 'Trusted antiseptic liquid that kills 99.9% germs. For wounds, bathing and cleaning.', catSlug: 'liquids' },
  { name: 'Dettol Antiseptic Liquid 500ml', brand: 'Dettol', pack: '500ml', mrp: 230, price: 207, description: 'Multi-use antiseptic liquid. Protects against germs causing infections.', catSlug: 'liquids' },
  { name: 'Dettol Antiseptic Liquid 1 Litre', brand: 'Dettol', pack: '1 Litre', mrp: 430, price: 387, description: 'Family size Dettol antiseptic liquid for disinfection and hygiene.', catSlug: 'liquids' },
  { name: 'Dettol Original Soap 125g (Pack of 4)', brand: 'Dettol', pack: '4x125g', mrp: 228, price: 205, description: 'Original antibacterial soap. Trusted germ protection with pine fragrance.', catSlug: 'fmcg' },
  { name: 'Dettol Skincare Soap 125g (Pack of 4)', brand: 'Dettol', pack: '4x125g', mrp: 228, price: 205, description: 'Moisturising antibacterial soap with cotton milk extract for soft skin.', catSlug: 'fmcg' },
  { name: 'Dettol Hand Sanitizer Original 200ml', brand: 'Dettol', pack: '200ml', mrp: 149, price: 134, description: 'Instant hand sanitizer gel. Kills 99.9% germs without water.', catSlug: 'fmcg' },
  { name: 'Dettol Handwash Original 200ml', brand: 'Dettol', pack: '200ml', mrp: 99, price: 89, description: 'Liquid hand wash that kills 99.9% germs. pH balanced for daily use.', catSlug: 'fmcg' },
  { name: 'Dettol Handwash Skincare 200ml', brand: 'Dettol', pack: '200ml', mrp: 99, price: 89, description: 'Liquid hand wash with moisturizer. Protects from germs while keeping hands soft.', catSlug: 'fmcg' },
  { name: 'Dettol Body Wash Original 250ml', brand: 'Dettol', pack: '250ml', mrp: 195, price: 175, description: 'Antibacterial body wash with 12-hour odour protection.', catSlug: 'fmcg' },
  { name: 'Dettol Disinfectant Spray Orchard Bloom 225ml', brand: 'Dettol', pack: '225ml', mrp: 325, price: 292, description: 'Disinfectant spray that kills 99.9% bacteria and viruses. For surfaces and fabrics.', catSlug: 'fmcg' },
  { name: 'Dettol Antiseptic Cream 30g', brand: 'Dettol', pack: '30g', mrp: 70, price: 63, description: 'Antiseptic cream for cuts, bites, scratches and stings.', catSlug: 'cream-ointment' },
  { name: 'Dettol Cool Bathing Soap 125g (Pack of 4)', brand: 'Dettol', pack: '4x125g', mrp: 228, price: 205, description: 'Cool antibacterial soap with menthol and eucalyptus for freshness.', catSlug: 'fmcg' },
  { name: 'Dettol No Touch Handwash Refill 250ml', brand: 'Dettol', pack: '250ml', mrp: 199, price: 179, description: 'Automatic no-touch hand wash refill. Touch-free hygienic hand washing.', catSlug: 'fmcg' },
  { name: 'Dettol Multi-Use Wipes (Pack of 80)', brand: 'Dettol', pack: '80 pcs', mrp: 350, price: 315, description: 'Antibacterial multi-surface wipes. Kills 99.9% germs on surfaces.', catSlug: 'fmcg' },
  { name: 'Dettol Hand Sanitizer Floral Essence 50ml', brand: 'Dettol', pack: '50ml', mrp: 55, price: 49, description: 'Pocket-size hand sanitizer with floral fragrance. Kills 99.9% germs.', catSlug: 'fmcg' },
  { name: 'Dettol Foaming Handwash Aloe Coconut 250ml', brand: 'Dettol', pack: '250ml', mrp: 199, price: 179, description: 'Rich foam hand wash with aloe vera and coconut. 10x better germ protection.', catSlug: 'fmcg' },
  { name: 'Dettol Kitchen Gel 400ml', brand: 'Dettol', pack: '400ml', mrp: 199, price: 179, description: 'Kitchen slab and dish cleaning gel that removes grease and kills germs.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MANKIND PHARMA                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */
const MANKIND = [
  { name: 'Mankind Acne Star Gel 22g', brand: 'Mankind', pack: '22g', mrp: 95, price: 85, description: 'Anti-acne gel with clindamycin and nicotinamide for pimple treatment.', catSlug: 'cream-ointment' },
  { name: 'Mankind Acne Star Face Wash 100ml', brand: 'Mankind', pack: '100ml', mrp: 175, price: 157, description: 'Anti-acne face wash with salicylic acid for oily and acne-prone skin.', catSlug: 'fmcg' },
  { name: 'Mankind Manforce Tablet (Pack of 4)', brand: 'Mankind', pack: '4 tabs', mrp: 320, price: 288, description: 'Sildenafil citrate 100mg tablets for erectile dysfunction. Prescription required.', catSlug: 'caps-tabs', rx: true },
  { name: 'Mankind Prega News Pregnancy Test Kit', brand: 'Mankind', pack: '1 kit', mrp: 55, price: 49, description: 'One-step pregnancy test card. Results in 5 minutes with 99% accuracy.', catSlug: 'fmcg' },
  { name: 'Mankind Unwanted 72 Tablet', brand: 'Mankind', pack: '1 tab', mrp: 100, price: 90, description: 'Emergency contraceptive pill with levonorgestrel 1.5mg. Single dose.', catSlug: 'caps-tabs' },
  { name: 'Mankind Gas-O-Fast Sachet Jeera (Pack of 24)', brand: 'Mankind', pack: '24 sachets', mrp: 120, price: 108, description: 'Ayurvedic antacid sachets for instant gas and acidity relief. Jeera flavour.', catSlug: 'powder' },
  { name: 'Mankind HealthOK Multivitamin Tablet (Pack of 15)', brand: 'Mankind', pack: '15 tabs', mrp: 140, price: 126, description: 'Daily multivitamin and multimineral tablets with taurine and ginseng for energy.', catSlug: 'caps-tabs' },
  { name: 'Mankind AcneStar Soap 75g', brand: 'Mankind', pack: '75g', mrp: 85, price: 76, description: 'Medicated soap with salicylic acid 2% for acne treatment and prevention.', catSlug: 'fmcg' },
  { name: 'Mankind Dydroboon 10mg Tablets (Strip of 10)', brand: 'Mankind', pack: '10 tabs', mrp: 260, price: 234, description: 'Dydrogesterone 10mg tablets for menstrual disorders and pregnancy support.', catSlug: 'caps-tabs', rx: true },
  { name: 'Mankind Manforce Staylong Gel 8g', brand: 'Mankind', pack: '8g', mrp: 90, price: 81, description: 'Topical delay gel for extended intimate performance.', catSlug: 'cream-ointment' },
  { name: 'Mankind Codistar Cough Syrup 100ml', brand: 'Mankind', pack: '100ml', mrp: 99, price: 89, description: 'Cough syrup with dextromethorphan for dry cough relief.', catSlug: 'liquids' },
  { name: 'Mankind Clingen Vaginal Suppository (Pack of 3)', brand: 'Mankind', pack: '3 pcs', mrp: 108, price: 97, description: 'Clindamycin and clotrimazole vaginal suppositories for infections.', catSlug: 'fmcg', rx: true },
  { name: 'Mankind Softovac SF Powder 100g', brand: 'Mankind', pack: '100g', mrp: 150, price: 135, description: 'Sugar-free laxative powder for constipation relief with isabgol and senna.', catSlug: 'powder' },
  { name: 'Mankind Karvol Plus Capsules (Strip of 10)', brand: 'Mankind', pack: '10 caps', mrp: 63, price: 56, description: 'Decongestant capsules with essential oils for cold and nasal congestion.', catSlug: 'caps-tabs' },
  { name: 'Mankind ORS Apple Flavour (Pack of 10)', brand: 'Mankind', pack: '10 sachets', mrp: 80, price: 72, description: 'Oral rehydration salt sachets for dehydration during diarrhea. Apple flavour.', catSlug: 'powder' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HIMALAYA                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */
const HIMALAYA = [
  { name: 'Himalaya Neem Face Wash 200ml', brand: 'Himalaya', pack: '200ml', mrp: 225, price: 202, description: 'Purifying neem face wash with turmeric for acne-free clear skin.', catSlug: 'fmcg' },
  { name: 'Himalaya Neem Face Wash 100ml', brand: 'Himalaya', pack: '100ml', mrp: 130, price: 117, description: 'Neem face wash that prevents pimples and cleanses impurities.', catSlug: 'fmcg' },
  { name: 'Himalaya Purifying Neem Scrub 100g', brand: 'Himalaya', pack: '100g', mrp: 165, price: 148, description: 'Neem scrub with apricot granules for exfoliation and acne prevention.', catSlug: 'fmcg' },
  { name: 'Himalaya Moisturizing Aloe Vera Face Wash 200ml', brand: 'Himalaya', pack: '200ml', mrp: 225, price: 202, description: 'Gentle aloe vera face wash for dry skin. Moisturizes while cleansing.', catSlug: 'fmcg' },
  { name: 'Himalaya Tan Removal Orange Face Wash 100ml', brand: 'Himalaya', pack: '100ml', mrp: 130, price: 117, description: 'Orange face wash with honey for tan removal and fresh skin.', catSlug: 'fmcg' },
  { name: 'Himalaya Anti-Hair Fall Shampoo 400ml', brand: 'Himalaya', pack: '400ml', mrp: 360, price: 324, description: 'Anti-hair fall shampoo with bhringaraja and palasha for reducing hair fall.', catSlug: 'fmcg' },
  { name: 'Himalaya Anti-Dandruff Shampoo 400ml', brand: 'Himalaya', pack: '400ml', mrp: 355, price: 319, description: 'Anti-dandruff shampoo with tea tree oil and aloe vera for flake-free scalp.', catSlug: 'fmcg' },
  { name: 'Himalaya Gentle Daily Care Protein Shampoo 400ml', brand: 'Himalaya', pack: '400ml', mrp: 270, price: 243, description: 'Daily protein shampoo with chickpea and amla for strong, smooth hair.', catSlug: 'fmcg' },
  { name: 'Himalaya Nourishing Skin Cream 200ml', brand: 'Himalaya', pack: '200ml', mrp: 225, price: 202, description: 'Nourishing skin cream with aloe vera and winter cherry for all-day moisture.', catSlug: 'cream-ointment' },
  { name: 'Himalaya Cocoa Butter Intensive Body Lotion 400ml', brand: 'Himalaya', pack: '400ml', mrp: 395, price: 355, description: 'Intensive body lotion with cocoa butter for extra dry skin. 48-hour moisture.', catSlug: 'lotion' },
  { name: 'Himalaya Anti-Hair Fall Hair Oil 200ml', brand: 'Himalaya', pack: '200ml', mrp: 225, price: 202, description: 'Anti-hair fall oil with bhringaraja and amalaki for hair strengthening.', catSlug: 'fmcg' },
  { name: 'Himalaya Lip Balm 10g', brand: 'Himalaya', pack: '10g', mrp: 65, price: 58, description: 'Natural lip balm with wheat germ oil and carrot seed oil for soft lips.', catSlug: 'cream-ointment' },
  { name: 'Himalaya Baby Lotion 200ml', brand: 'Himalaya', pack: '200ml', mrp: 195, price: 175, description: 'Baby lotion with olive oil and almond oil for soft, smooth baby skin.', catSlug: 'lotion' },
  { name: 'Himalaya Baby Cream 200ml', brand: 'Himalaya', pack: '200ml', mrp: 177, price: 159, description: 'Baby cream with country mallow and winter cherry for nourishment and protection.', catSlug: 'cream-ointment' },
  { name: 'Himalaya Baby Shampoo 200ml', brand: 'Himalaya', pack: '200ml', mrp: 160, price: 144, description: 'Mild, tear-free baby shampoo with hibiscus and chickpea.', catSlug: 'fmcg' },
  { name: 'Himalaya Gentle Baby Soap 125g (Pack of 4)', brand: 'Himalaya', pack: '4x125g', mrp: 240, price: 216, description: 'Gentle baby soap with almond oil and olive oil. No parabens, no phthalates.', catSlug: 'fmcg' },
  { name: 'Himalaya Diaper Rash Cream 50g', brand: 'Himalaya', pack: '50g', mrp: 120, price: 108, description: 'Diaper rash cream with aloe vera and zinc oxide to heal and protect.', catSlug: 'cream-ointment' },
  { name: 'Himalaya Wellness Ashvagandha Tablets (60 tabs)', brand: 'Himalaya', pack: '60 tabs', mrp: 210, price: 189, description: 'Pure herb ashwagandha tablets for stress relief and energy boost.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Wellness Triphala Tablets (60 tabs)', brand: 'Himalaya', pack: '60 tabs', mrp: 175, price: 157, description: 'Triphala tablets for digestive wellness and detoxification.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Wellness Brahmi Tablets (60 tabs)', brand: 'Himalaya', pack: '60 tabs', mrp: 175, price: 157, description: 'Brahmi tablets for memory enhancement and mental alertness.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Liv.52 Tablets (100 tabs)', brand: 'Himalaya', pack: '100 tabs', mrp: 155, price: 139, description: 'World renowned liver tonic. Restores liver function and protects liver.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Liv.52 Syrup 200ml', brand: 'Himalaya', pack: '200ml', mrp: 120, price: 108, description: 'Herbal liver tonic syrup with caper bush and chicory for liver protection.', catSlug: 'liquids' },
  { name: 'Himalaya Septilin Tablets (60 tabs)', brand: 'Himalaya', pack: '60 tabs', mrp: 160, price: 144, description: 'Immunity booster tablets with guduchi and Indian bdellium.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Bonnisan Liquid 120ml', brand: 'Himalaya', pack: '120ml', mrp: 80, price: 72, description: 'Digestive tonic for babies and children. Relieves colic and digestive complaints.', catSlug: 'liquids' },
  { name: 'Himalaya Cystone Tablets (60 tabs)', brand: 'Himalaya', pack: '60 tabs', mrp: 165, price: 148, description: 'Urinary tract supplement for kidney stone prevention and UTI management.', catSlug: 'caps-tabs' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DABUR                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */
const DABUR = [
  { name: 'Dabur Chyawanprash 500g', brand: 'Dabur', pack: '500g', mrp: 275, price: 247, description: 'Ayurvedic immunity booster with 40+ herbs. 3x more immunity.', catSlug: 'fmcg' },
  { name: 'Dabur Chyawanprash 1kg', brand: 'Dabur', pack: '1kg', mrp: 440, price: 396, description: 'Double immunity chyawanprash with amla, ashwagandha and giloy. For all ages.', catSlug: 'fmcg' },
  { name: 'Dabur Honey 500g', brand: 'Dabur', pack: '500g', mrp: 269, price: 242, description: '100% pure honey. World\'s No. 1 honey brand. NMR tested for purity.', catSlug: 'fmcg' },
  { name: 'Dabur Honey 1kg', brand: 'Dabur', pack: '1kg', mrp: 459, price: 413, description: '100% pure honey. Rich in antioxidants. No added sugar.', catSlug: 'fmcg' },
  { name: 'Dabur Red Paste 200g', brand: 'Dabur', pack: '200g', mrp: 108, price: 97, description: 'Ayurvedic toothpaste with 13 active ingredients for strong teeth and healthy gums.', catSlug: 'fmcg' },
  { name: 'Dabur Amla Hair Oil 450ml', brand: 'Dabur', pack: '450ml', mrp: 250, price: 225, description: 'India\'s No. 1 hair oil with amla for strong, long and thick hair.', catSlug: 'fmcg' },
  { name: 'Dabur Amla Hair Oil 275ml', brand: 'Dabur', pack: '275ml', mrp: 160, price: 144, description: 'Amla hair oil enriched with gooseberry for nourished, dark hair.', catSlug: 'fmcg' },
  { name: 'Dabur Vatika Enriched Coconut Hair Oil 450ml', brand: 'Dabur', pack: '450ml', mrp: 255, price: 229, description: 'Coconut hair oil with henna, amla and lemon for damage protection.', catSlug: 'fmcg' },
  { name: 'Dabur Almond Hair Oil 500ml', brand: 'Dabur', pack: '500ml', mrp: 337, price: 303, description: 'Non-sticky almond hair oil with vitamins for soft, silky hair.', catSlug: 'fmcg' },
  { name: 'Dabur Gulabari Rose Water 250ml', brand: 'Dabur', pack: '250ml', mrp: 100, price: 90, description: 'Premium rose water for glowing skin. Can be used as toner.', catSlug: 'fmcg' },
  { name: 'Dabur Sat Isabgol 200g', brand: 'Dabur', pack: '200g', mrp: 190, price: 171, description: 'Natural psyllium husk for constipation relief and digestive health.', catSlug: 'powder' },
  { name: 'Dabur Pudin Hara Liquid 30ml', brand: 'Dabur', pack: '30ml', mrp: 52, price: 47, description: 'Spearmint and peppermint formulation for stomach ache and indigestion.', catSlug: 'liquids' },
  { name: 'Dabur Hajmola Regular 120 tabs', brand: 'Dabur', pack: '120 tabs', mrp: 55, price: 49, description: 'Digestive tablets with hing, jeera and black salt for taste and digestion.', catSlug: 'caps-tabs' },
  { name: 'Dabur Honitus Cough Syrup 100ml', brand: 'Dabur', pack: '100ml', mrp: 80, price: 72, description: 'Herbal cough syrup with honey and tulsi. Non-drowsy formula.', catSlug: 'liquids' },
  { name: 'Dabur Lal Tail 200ml', brand: 'Dabur', pack: '200ml', mrp: 195, price: 175, description: 'Ayurvedic baby massage oil for strong bones and healthy growth.', catSlug: 'fmcg' },
  { name: 'Dabur Gripe Water 125ml', brand: 'Dabur', pack: '125ml', mrp: 65, price: 58, description: 'Gripe water for babies to relieve colic and digestive discomfort.', catSlug: 'liquids' },
  { name: 'Dabur Babool Toothpaste 175g', brand: 'Dabur', pack: '175g', mrp: 80, price: 72, description: 'Ayurvedic toothpaste with babool for strong gums and teeth.', catSlug: 'fmcg' },
  { name: 'Dabur Meswak Toothpaste 200g', brand: 'Dabur', pack: '200g', mrp: 114, price: 102, description: 'Pure miswak extract toothpaste for complete oral care.', catSlug: 'fmcg' },
  { name: 'Dabur Glucose-D 500g', brand: 'Dabur', pack: '500g', mrp: 135, price: 121, description: 'Instant energy glucose with vitamin D for summer hydration.', catSlug: 'powder' },
  { name: 'Dabur Shilajit Gold Capsules (20 caps)', brand: 'Dabur', pack: '20 caps', mrp: 400, price: 360, description: 'Shilajit gold capsules with kesar for strength and stamina.', catSlug: 'caps-tabs' },
  { name: 'Dabur Triphala Churna 120g', brand: 'Dabur', pack: '120g', mrp: 95, price: 85, description: 'Triphala churna for digestive wellness and detoxification.', catSlug: 'powder' },
  { name: 'Dabur Ashwagandharishta 450ml', brand: 'Dabur', pack: '450ml', mrp: 160, price: 144, description: 'Ayurvedic tonic with ashwagandha for stress relief and vitality.', catSlug: 'liquids' },
  { name: 'Dabur Janma Ghunti Honey 125ml', brand: 'Dabur', pack: '125ml', mrp: 82, price: 73, description: 'Ayurvedic digestive tonic for babies with honey base.', catSlug: 'liquids' },
  { name: 'Dabur Nature Care Isabgol 375g', brand: 'Dabur', pack: '375g', mrp: 299, price: 269, description: 'Double action isabgol for constipation relief and colon cleansing.', catSlug: 'powder' },
  { name: 'Dabur Rheumatil Gel 30g', brand: 'Dabur', pack: '30g', mrp: 100, price: 90, description: 'Ayurvedic pain relief gel for joint and muscle pain.', catSlug: 'cream-ointment' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HAIR & CARE                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */
const HAIRNCARE = [
  { name: 'Hair & Care Fruit Oils with Orange, Anaar & Strawberry 300ml', brand: 'Hair & Care', pack: '300ml', mrp: 185, price: 166, description: 'Non-sticky hair oil with fruit vitamins for silky soft hair.', catSlug: 'fmcg' },
  { name: 'Hair & Care Fruit Oils 500ml', brand: 'Hair & Care', pack: '500ml', mrp: 280, price: 252, description: 'Fruit oils for damage repair and nourished, shiny hair.', catSlug: 'fmcg' },
  { name: 'Hair & Care Fruit Oils with Multivitamins 200ml', brand: 'Hair & Care', pack: '200ml', mrp: 135, price: 121, description: 'Multivitamin hair oil with grape seed for smooth, strong hair.', catSlug: 'fmcg' },
  { name: 'Hair & Care Dry Fruit Oil with Walnut & Almond 300ml', brand: 'Hair & Care', pack: '300ml', mrp: 210, price: 189, description: 'Dry fruit hair oil with walnut and almond for 2x stronger hair.', catSlug: 'fmcg' },
  { name: 'Hair & Care Dry Fruit Oil 500ml', brand: 'Hair & Care', pack: '500ml', mrp: 320, price: 288, description: 'Premium dry fruit oil with walnut and almond for thick, strong hair.', catSlug: 'fmcg' },
  { name: 'Hair & Care Damage Repair Non-Sticky Hair Oil 200ml', brand: 'Hair & Care', pack: '200ml', mrp: 130, price: 117, description: 'Non-sticky lightweight oil for damage repair and daily nourishment.', catSlug: 'fmcg' },
  { name: 'Hair & Care Silk-n-Shine Leave-in Conditioner 100ml', brand: 'Hair & Care', pack: '100ml', mrp: 99, price: 89, description: 'Leave-in hair conditioner for frizz control and silky smoothness.', catSlug: 'fmcg' },
  { name: 'Hair & Care Fruit Oils with Aloevera, Olive & Green Apple 300ml', brand: 'Hair & Care', pack: '300ml', mrp: 185, price: 166, description: 'Fruit oil with aloe vera and olive oil for deep conditioning.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN                                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
const ALL_BRANDS = [
  { label: 'Cetaphil',    data: CETAPHIL },
  { label: 'DermaCo',     data: DERMACO },
  { label: 'Dermatouch',  data: DERMATOUCH },
  { label: 'Durex',       data: DUREX },
  { label: 'Manforce',    data: MANFORCE },
  { label: 'Skore',       data: SKORE },
  { label: 'Dettol',      data: DETTOL },
  { label: 'Mankind',     data: MANKIND },
  { label: 'Himalaya',    data: HIMALAYA },
  { label: 'Dabur',       data: DABUR },
  { label: 'Hair & Care', data: HAIRNCARE },
];

async function main() {
  const totalProducts = ALL_BRANDS.reduce((s, b) => s + b.data.length, 0);
  console.log(`Seeding ${ALL_BRANDS.length} brands (${totalProducts} products)...\n`);

  // Ensure needed categories exist
  const catCache = {};
  const catNames = {
    fmcg: 'FMCG',
    'cream-ointment': 'Cream & Ointment',
    lotion: 'Lotion',
    liquids: 'Liquids',
    'caps-tabs': 'Caps & Tabs',
    powder: 'Powder',
  };
  const neededSlugs = new Set(ALL_BRANDS.flatMap(b => b.data.map(p => p.catSlug)));
  for (const slug of neededSlugs) {
    catCache[slug] = await ensureCategory(catNames[slug] || slug, slug);
  }

  let grandTotal = 0;
  for (const brand of ALL_BRANDS) {
    let inserted = 0;
    for (const p of brand.data) {
      try {
        await insertProduct(
          { ...p, ...(p.rx ? {} : {}) },
          catCache[p.catSlug]
        );
        inserted++;
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') continue;
        console.error(`  x ${p.name}:`, e.message);
      }
    }
    grandTotal += inserted;
    console.log(`  ${brand.label}: ${inserted}/${brand.data.length} products added`);
  }

  console.log(`\nDone. Total ${grandTotal} products seeded.`);
  process.exit(0);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
