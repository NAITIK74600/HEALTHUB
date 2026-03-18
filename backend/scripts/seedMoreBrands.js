'use strict';
/**
 * Seed products for 25+ additional reputed brands NOT covered in seedAllBrands.js
 * Already covered (skip): Cetaphil, DermaCo, Dermatouch, Durex, Manforce, Skore,
 *   Dettol, Mankind, Himalaya, Dabur, Hair & Care, Mamaearth, Bella Vita
 *
 * NEW brands in this file:
 *   Nivea, Neutrogena, Biotique, Boroplus, Volini, Vicks,
 *   Colgate, Pepsodent, Sensodyne, Moov, Zandu, Baidyanath, Hamdard,
 *   Cipla Health, Dr. Morepen, Emami, Vaseline, Dove, Lifebuoy,
 *   Savlon, Betadine, Wipro (Yardley / Santoor), Johnson & Johnson,
 *   Sunsilk / Clinic Plus, Garnier
 *
 * Usage: node backend/scripts/seedMoreBrands.js
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
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
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
      p.rx ? 1 : 0,
      p.image ? JSON.stringify([p.image]) : '[]',
    ]
  );
  return slug;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  NIVEA                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */
const NIVEA = [
  { name: 'Nivea Soft Light Moisturiser Cream 100ml', brand: 'Nivea', pack: '100ml', mrp: 230, price: 207, description: 'Refreshingly soft moisturising cream with vitamin E and jojoba oil.', catSlug: 'cream-ointment' },
  { name: 'Nivea Soft Light Moisturiser Cream 200ml', brand: 'Nivea', pack: '200ml', mrp: 375, price: 337, description: 'Lightweight non-greasy cream for face, hands and body with vitamin E.', catSlug: 'cream-ointment' },
  { name: 'Nivea Creme 60ml', brand: 'Nivea', pack: '60ml', mrp: 175, price: 157, description: 'Classic all-purpose moisturising creme for skin care. Trusted for over 100 years.', catSlug: 'cream-ointment' },
  { name: 'Nivea Creme 200ml', brand: 'Nivea', pack: '200ml', mrp: 379, price: 341, description: 'Iconic blue tin moisture cream for dry skin. Rich and protective formula.', catSlug: 'cream-ointment' },
  { name: 'Nivea Body Lotion Nourishing Body Milk 200ml', brand: 'Nivea', pack: '200ml', mrp: 285, price: 256, description: 'Deep moisture body lotion for very dry skin with almond oil.', catSlug: 'lotion' },
  { name: 'Nivea Body Lotion Nourishing Body Milk 400ml', brand: 'Nivea', pack: '400ml', mrp: 475, price: 427, description: 'Intensive nourishing body milk for 48-hour deep moisture.', catSlug: 'lotion' },
  { name: 'Nivea Sun Protect & Moisture SPF 50 Lotion 75ml', brand: 'Nivea', pack: '75ml', mrp: 499, price: 449, description: 'Water-resistant sunscreen with SPF 50 and vitamin E. Immediate UVA/UVB protection.', catSlug: 'lotion' },
  { name: 'Nivea Men Dark Spot Reduction Cream 50ml', brand: 'Nivea', pack: '50ml', mrp: 249, price: 224, description: 'Dark spot reduction cream with 10x vitamin C for men. Even-toned skin.', catSlug: 'cream-ointment' },
  { name: 'Nivea Men All-In-One Face Wash 100ml', brand: 'Nivea', pack: '100ml', mrp: 225, price: 202, description: 'Multi-effect face wash for men – oil control, dark spots, and acne prone skin.', catSlug: 'fmcg' },
  { name: 'Nivea Lip Balm Original Care 4.8g', brand: 'Nivea', pack: '4.8g', mrp: 175, price: 157, description: 'Original lip care with shea butter and natural oils for soft lips.', catSlug: 'fmcg' },
  { name: 'Nivea Milk Delights Face Wash Honey 100ml', brand: 'Nivea', pack: '100ml', mrp: 199, price: 179, description: 'Face wash with honey and milk for nourished glowing skin.', catSlug: 'fmcg' },
  { name: 'Nivea Pearl & Beauty Deodorant Roll On 50ml', brand: 'Nivea', pack: '50ml', mrp: 199, price: 179, description: 'Antiperspirant roll-on with pearl extracts for beautiful underarms.', catSlug: 'fmcg' },
  { name: 'Nivea Extra White Body Lotion SPF 25 200ml', brand: 'Nivea', pack: '200ml', mrp: 325, price: 292, description: 'Body lotion with vitamin C for brighter, even-toned skin with SPF protection.', catSlug: 'lotion' },
  { name: 'Nivea Cocoa Butter Body Lotion 200ml', brand: 'Nivea', pack: '200ml', mrp: 310, price: 279, description: 'Deeply moisturising body lotion enriched with cocoa butter for dry skin.', catSlug: 'lotion' },
  { name: 'Nivea Men Fresh Active Deodorant 150ml', brand: 'Nivea', pack: '150ml', mrp: 249, price: 224, description: 'Ocean extracts deodorant spray for long lasting freshness and protection.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  NEUTROGENA                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */
const NEUTROGENA = [
  { name: 'Neutrogena Ultra Sheer Dry Touch Sunblock SPF 50+ 30ml', brand: 'Neutrogena', pack: '30ml', mrp: 549, price: 494, description: 'Ultra-light dry touch sunscreen with Helioplex technology. Non-greasy, fast absorbing.', catSlug: 'cream-ointment' },
  { name: 'Neutrogena Ultra Sheer Dry Touch Sunblock SPF 50+ 88ml', brand: 'Neutrogena', pack: '88ml', mrp: 999, price: 899, description: 'Broad spectrum sunscreen with SPF 50+ PA+++. Dermatologist recommended for daily use.', catSlug: 'cream-ointment' },
  { name: 'Neutrogena Deep Clean Facial Cleanser 200ml', brand: 'Neutrogena', pack: '200ml', mrp: 499, price: 449, description: 'Oil-free facial cleanser that deep cleans while dissolving dirt and makeup.', catSlug: 'fmcg' },
  { name: 'Neutrogena Deep Clean Facial Cleanser 100ml', brand: 'Neutrogena', pack: '100ml', mrp: 349, price: 314, description: 'Beta hydroxy acid formula dissolves oil and removes dead skin cells.', catSlug: 'fmcg' },
  { name: 'Neutrogena Hydro Boost Water Gel Moisturiser 50g', brand: 'Neutrogena', pack: '50g', mrp: 999, price: 899, description: 'Hyaluronic acid based water gel moisturiser for supple, bouncy skin.', catSlug: 'cream-ointment' },
  { name: 'Neutrogena Hydro Boost Cleansing Lotion 200ml', brand: 'Neutrogena', pack: '200ml', mrp: 599, price: 539, description: 'Gentle cleansing lotion with hyaluronic acid. Removes impurities without over-drying.', catSlug: 'lotion' },
  { name: 'Neutrogena Norwegian Formula Hand Cream 56g', brand: 'Neutrogena', pack: '56g', mrp: 349, price: 314, description: 'Concentrated hand cream for extremely dry hands. Glycerin-rich formula.', catSlug: 'cream-ointment' },
  { name: 'Neutrogena Oil-Free Acne Wash 175ml', brand: 'Neutrogena', pack: '175ml', mrp: 499, price: 449, description: 'Salicylic acid acne face wash that treats and prevents breakouts.', catSlug: 'fmcg' },
  { name: 'Neutrogena Fine Fairness Brightening Serum 30ml', brand: 'Neutrogena', pack: '30ml', mrp: 999, price: 899, description: 'Brightening serum with Hexinol technology for radiant, even-toned skin.', catSlug: 'cream-ointment' },
  { name: 'Neutrogena Rapid Wrinkle Repair Moisturizer SPF 30 29ml', brand: 'Neutrogena', pack: '29ml', mrp: 1699, price: 1529, description: 'Anti-wrinkle moisturizer with retinol SA and SPF 30 for younger looking skin.', catSlug: 'cream-ointment' },
  { name: 'Neutrogena T/Gel Therapeutic Shampoo 130ml', brand: 'Neutrogena', pack: '130ml', mrp: 620, price: 558, description: 'Medicated shampoo with coal tar extract for scalp psoriasis and dandruff.', catSlug: 'fmcg' },
  { name: 'Neutrogena Body Lotion Intense Repair 400ml', brand: 'Neutrogena', pack: '400ml', mrp: 599, price: 539, description: 'Intensive body lotion for extremely dry, flaky skin. 24-hour moisture.', catSlug: 'lotion' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  BIOTIQUE                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
const BIOTIQUE = [
  { name: 'Biotique Bio Neem Purifying Face Wash 200ml', brand: 'Biotique', pack: '200ml', mrp: 199, price: 179, description: 'Neem face wash for preventing acne and pimples. Soap-free purifying formula.', catSlug: 'fmcg' },
  { name: 'Biotique Bio Morning Nectar Flawless Skin Lotion 190ml', brand: 'Biotique', pack: '190ml', mrp: 249, price: 224, description: 'Skin-brightening and nourishing lotion with wheatgerm and honey.', catSlug: 'lotion' },
  { name: 'Biotique Bio Aloe Vera Face & Body Sun Lotion SPF 75 120ml', brand: 'Biotique', pack: '120ml', mrp: 399, price: 359, description: 'High SPF sunscreen with aloe vera for face and body. UVA/UVB protection.', catSlug: 'lotion' },
  { name: 'Biotique Bio Coconut Whitening & Brightening Cream 50g', brand: 'Biotique', pack: '50g', mrp: 199, price: 179, description: 'Coconut cream for skin brightening with kaolin clay and dandelion.', catSlug: 'cream-ointment' },
  { name: 'Biotique Bio Papaya Revitalizing Tan Removal Scrub 75g', brand: 'Biotique', pack: '75g', mrp: 175, price: 157, description: 'Papaya enzyme scrub for tan removal and revealing fresh skin.', catSlug: 'fmcg' },
  { name: 'Biotique Bio Honey Gel Refreshing Foaming Face Wash 150ml', brand: 'Biotique', pack: '150ml', mrp: 175, price: 157, description: 'Honey gel face wash for all skin types. Gentle cleansing with natural ingredients.', catSlug: 'fmcg' },
  { name: 'Biotique Bio Kelp Protein Shampoo 340ml', brand: 'Biotique', pack: '340ml', mrp: 280, price: 252, description: 'Protein shampoo for falling hair with kelp, peppermint oil and natural proteins.', catSlug: 'fmcg' },
  { name: 'Biotique Bio Bhringraj Therapeutic Hair Oil 200ml', brand: 'Biotique', pack: '200ml', mrp: 255, price: 229, description: 'Bhringraj hair oil for falling hair with centella and amla. Strengthens roots.', catSlug: 'fmcg' },
  { name: 'Biotique Bio Cucumber Pore Tightening Toner 120ml', brand: 'Biotique', pack: '120ml', mrp: 175, price: 157, description: 'Cucumber toner with Himalayan waters and coriander for pore tightening.', catSlug: 'fmcg' },
  { name: 'Biotique Bio Almond Oil Soothing Face & Eye Makeup Cleanser 120ml', brand: 'Biotique', pack: '120ml', mrp: 199, price: 179, description: 'Almond oil cleanser to gently remove makeup without stripping natural moisture.', catSlug: 'fmcg' },
  { name: 'Biotique Bio Fruit Whitening Lip Balm 12g', brand: 'Biotique', pack: '12g', mrp: 149, price: 134, description: 'Fruit-based lip balm for lightening dark lips and keeping them soft.', catSlug: 'fmcg' },
  { name: 'Biotique Bio Aloe Vera Baby Sun Block SPF 50 50g', brand: 'Biotique', pack: '50g', mrp: 249, price: 224, description: 'Gentle baby sunscreen with SPF 50. Free from harsh chemicals for baby skin.', catSlug: 'cream-ointment' },
  { name: 'Biotique Bio Dandelion Ageless Lightening Serum 40ml', brand: 'Biotique', pack: '40ml', mrp: 299, price: 269, description: 'Anti-aging lightening serum with safflower and saffron for youthful glow.', catSlug: 'cream-ointment' },
  { name: 'Biotique Bio Winter Green Spot Correcting Anti-Acne Cream 15g', brand: 'Biotique', pack: '15g', mrp: 175, price: 157, description: 'Spot correcting cream with winter green and saffron for acne marks.', catSlug: 'cream-ointment' },
  { name: 'Biotique Bio Apricot Refreshing Body Wash 190ml', brand: 'Biotique', pack: '190ml', mrp: 175, price: 157, description: 'Fruity body wash with apricot gel and wild turmeric for refreshed skin.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  BOROPLUS                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
const BOROPLUS = [
  { name: 'BoroPlus Antiseptic Cream 40ml', brand: 'BoroPlus', pack: '40ml', mrp: 62, price: 55, description: 'Antiseptic cream with turmeric and aloe vera for cuts, burns and dry skin.', catSlug: 'cream-ointment' },
  { name: 'BoroPlus Antiseptic Cream 80ml', brand: 'BoroPlus', pack: '80ml', mrp: 95, price: 85, description: 'Ayurvedic antiseptic cream for skin infections, rashes and cracked heels.', catSlug: 'cream-ointment' },
  { name: 'BoroPlus Doodh Kesar Body Lotion 300ml', brand: 'BoroPlus', pack: '300ml', mrp: 199, price: 179, description: 'Body lotion with milk, kesar and haldi for soft glowing skin.', catSlug: 'lotion' },
  { name: 'BoroPlus Healthy Skin Aloe Vera Gel 150ml', brand: 'BoroPlus', pack: '150ml', mrp: 150, price: 135, description: 'Pure aloe vera gel with vitamin E for soothing, cooling skin care.', catSlug: 'cream-ointment' },
  { name: 'BoroPlus Perfect Touch Face Cream 50g', brand: 'BoroPlus', pack: '50g', mrp: 125, price: 112, description: 'Fairness face cream with micro-shimmer particles for a flawless look.', catSlug: 'cream-ointment' },
  { name: 'BoroPlus Prickly Heat Powder 150g', brand: 'BoroPlus', pack: '150g', mrp: 99, price: 89, description: 'Cooling prickly heat powder for instant relief from rashes and irritation.', catSlug: 'powder' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  VOLINI                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */
const VOLINI = [
  { name: 'Volini Pain Relief Spray 40g', brand: 'Volini', pack: '40g', mrp: 142, price: 127, description: 'Fast acting pain relief spray for muscle pain, sprains and joint pain.', catSlug: 'fmcg' },
  { name: 'Volini Pain Relief Spray 100g', brand: 'Volini', pack: '100g', mrp: 285, price: 256, description: 'Diclofenac based spray for quick relief from back pain and body aches.', catSlug: 'fmcg' },
  { name: 'Volini Pain Relief Gel 30g', brand: 'Volini', pack: '30g', mrp: 115, price: 103, description: 'Fast pain relief gel with diclofenac for muscle and joint pain.', catSlug: 'cream-ointment' },
  { name: 'Volini Pain Relief Gel 75g', brand: 'Volini', pack: '75g', mrp: 235, price: 211, description: 'Topical pain relief gel for arthritis, frozen shoulder and sports injuries.', catSlug: 'cream-ointment' },
  { name: 'Volini Maxx Gel 30g', brand: 'Volini', pack: '30g', mrp: 170, price: 153, description: 'Extra-strong formula with diclofenac diethylamine for severe pain relief.', catSlug: 'cream-ointment' },
  { name: 'Volini Pain Relief Patch 2s', brand: 'Volini', pack: '2 Patches', mrp: 99, price: 89, description: 'Transdermal pain relief patches for sustained relief up to 8 hours.', catSlug: 'pharma-misc' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  VICKS                                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
const VICKS = [
  { name: 'Vicks VapoRub 50ml', brand: 'Vicks', pack: '50ml', mrp: 165, price: 148, description: 'Trusted cold rub for cough, cold and body ache relief. Aromatic formula.', catSlug: 'cream-ointment' },
  { name: 'Vicks VapoRub 25ml', brand: 'Vicks', pack: '25ml', mrp: 85, price: 76, description: 'Topical cough suppressant with camphor, menthol and eucalyptus oil.', catSlug: 'cream-ointment' },
  { name: 'Vicks Action 500 Advanced 10 Tabs', brand: 'Vicks', pack: '10 Tabs', mrp: 62, price: 55, description: 'Cold and flu relief tablets with paracetamol, phenylephrine and caffeine.', catSlug: 'caps-tabs' },
  { name: 'Vicks Cough Drops Honey 20s', brand: 'Vicks', pack: '20s', mrp: 40, price: 36, description: 'Menthol cough drops with soothing honey flavour for throat relief.', catSlug: 'fmcg' },
  { name: 'Vicks Inhaler 0.5ml', brand: 'Vicks', pack: '0.5ml', mrp: 75, price: 67, description: 'Nasal inhaler with menthol and camphor for quick nasal congestion relief.', catSlug: 'fmcg' },
  { name: 'Vicks BabyRub 50ml', brand: 'Vicks', pack: '50ml', mrp: 195, price: 175, description: 'Gentle rub for babies with aloe vera, lavender and rosemary for soothing comfort.', catSlug: 'cream-ointment' },
  { name: 'Vicks VapoRub 110ml', brand: 'Vicks', pack: '110ml', mrp: 305, price: 274, description: 'Jumbo pack VapoRub for family. Relief from cough, cold, headache and body ache.', catSlug: 'cream-ointment' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  COLGATE                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */
const COLGATE = [
  { name: 'Colgate MaxFresh Blue Gel Peppermint Ice Toothpaste 150g', brand: 'Colgate', pack: '150g', mrp: 128, price: 115, description: 'Cooling crystal gel toothpaste with peppermint for freshest breath.', catSlug: 'fmcg' },
  { name: 'Colgate Strong Teeth Toothpaste 200g', brand: 'Colgate', pack: '200g', mrp: 110, price: 99, description: 'India number 1 toothpaste with calcium boost for strong teeth and cavity protection.', catSlug: 'fmcg' },
  { name: 'Colgate Total Whole Mouth Health Toothpaste 120g', brand: 'Colgate', pack: '120g', mrp: 185, price: 166, description: 'Advanced toothpaste for whole mouth health — teeth, tongue, cheeks and gums.', catSlug: 'fmcg' },
  { name: 'Colgate Visible White Toothpaste 100g', brand: 'Colgate', pack: '100g', mrp: 170, price: 153, description: 'Whitening toothpaste with micro-cleansing crystals for visibly whiter teeth.', catSlug: 'fmcg' },
  { name: 'Colgate Sensitive Pro Relief Toothpaste 80g', brand: 'Colgate', pack: '80g', mrp: 195, price: 175, description: 'Sensitivity relief toothpaste with Pro-Argin technology for instant and lasting relief.', catSlug: 'fmcg' },
  { name: 'Colgate Vedshakti Toothpaste 200g', brand: 'Colgate', pack: '200g', mrp: 130, price: 117, description: 'Ayurvedic toothpaste with neem, clove and other herbs for complete oral care.', catSlug: 'fmcg' },
  { name: 'Colgate Slim Soft Charcoal Toothbrush', brand: 'Colgate', pack: '1 pc', mrp: 75, price: 67, description: 'Ultra-slim tip bristles infused with charcoal for deep cleaning.', catSlug: 'fmcg' },
  { name: 'Colgate Mouthwash Plax Fresh Tea 250ml', brand: 'Colgate', pack: '250ml', mrp: 140, price: 126, description: 'Antibacterial mouthwash with green tea extract for 24/7 fresh breath.', catSlug: 'fmcg' },
  { name: 'Colgate Swarna Vedshakti Toothpaste 200g', brand: 'Colgate', pack: '200g', mrp: 170, price: 153, description: 'Premium ayurvedic toothpaste with swarna bhasma (gold) for germs protection.', catSlug: 'fmcg' },
  { name: 'Colgate Kids Barbie Toothpaste 80g', brand: 'Colgate', pack: '80g', mrp: 95, price: 85, description: 'Bubble fruit flavour kids toothpaste with gentle fluoride formula.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SENSODYNE                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */
const SENSODYNE = [
  { name: 'Sensodyne Fresh Gel Toothpaste 150g', brand: 'Sensodyne', pack: '150g', mrp: 260, price: 234, description: 'Sensitivity relief toothpaste with potassium nitrate for daily protection.', catSlug: 'fmcg' },
  { name: 'Sensodyne Rapid Relief Toothpaste 80g', brand: 'Sensodyne', pack: '80g', mrp: 245, price: 220, description: 'Clinically proven fast relief from tooth sensitivity within 60 seconds.', catSlug: 'fmcg' },
  { name: 'Sensodyne Repair & Protect Toothpaste 100g', brand: 'Sensodyne', pack: '100g', mrp: 335, price: 301, description: 'Novamin technology forms a protective layer over exposed dentine for lasting relief.', catSlug: 'fmcg' },
  { name: 'Sensodyne Deep Clean Toothpaste 70g', brand: 'Sensodyne', pack: '70g', mrp: 215, price: 193, description: 'Deep cleaning formula for sensitive teeth with micro-foam action.', catSlug: 'fmcg' },
  { name: 'Sensodyne Gentle Whitening Toothpaste 100g', brand: 'Sensodyne', pack: '100g', mrp: 290, price: 261, description: 'Whitening toothpaste safe for sensitive teeth. Removes stains gently.', catSlug: 'fmcg' },
  { name: 'Sensodyne Complete Protection Toothpaste 70g', brand: 'Sensodyne', pack: '70g', mrp: 240, price: 216, description: 'All-around sensitivity care with cavity and gum protection.', catSlug: 'fmcg' },
  { name: 'Sensodyne Sensitivity & Gum Toothpaste 100g', brand: 'Sensodyne', pack: '100g', mrp: 340, price: 306, description: 'Dual action toothpaste for sensitivity and gum health simultaneously.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MOOV                                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
const MOOV = [
  { name: 'Moov Pain Relief Cream 30g', brand: 'Moov', pack: '30g', mrp: 100, price: 90, description: 'Fast-acting pain relief cream with diclofenac for back pain and muscular pain.', catSlug: 'cream-ointment' },
  { name: 'Moov Pain Relief Cream 50g', brand: 'Moov', pack: '50g', mrp: 150, price: 135, description: 'Topical pain reliever with wintergreen oil and menthol for joint aches.', catSlug: 'cream-ointment' },
  { name: 'Moov Pain Relief Spray 80g', brand: 'Moov', pack: '80g', mrp: 245, price: 220, description: 'Instant pain relief spray. No mess, easy to apply on affected areas.', catSlug: 'fmcg' },
  { name: 'Moov Strong Diclofenac Gel 30g', brand: 'Moov', pack: '30g', mrp: 119, price: 107, description: 'Extra strong formula with 2% diclofenac for severe pain conditions.', catSlug: 'cream-ointment' },
  { name: 'Moov Advance Diclofenac Gel 50g', brand: 'Moov', pack: '50g', mrp: 175, price: 157, description: 'Advanced formula for knee pain, back pain and sports injuries.', catSlug: 'cream-ointment' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ZANDU                                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
const ZANDU = [
  { name: 'Zandu Balm 25ml', brand: 'Zandu', pack: '25ml', mrp: 85, price: 76, description: 'Ayurvedic headache and body pain balm with turpentine oil and camphor.', catSlug: 'cream-ointment' },
  { name: 'Zandu Balm Ultra Power 8ml', brand: 'Zandu', pack: '8ml', mrp: 45, price: 40, description: 'Ultra powerful pain balm for strong headaches and body pain.', catSlug: 'cream-ointment' },
  { name: 'Zandu Pancharishta 450ml', brand: 'Zandu', pack: '450ml', mrp: 175, price: 157, description: 'Ayurvedic digestive tonic with 35 herbs for gas, acidity and indigestion.', catSlug: 'liquids' },
  { name: 'Zandu Chyawanprash Avaleha 900g', brand: 'Zandu', pack: '900g', mrp: 310, price: 279, description: 'Traditional chyawanprash for immunity boosting with 40+ ayurvedic herbs.', catSlug: 'ayurvedic' },
  { name: 'Zandu Nityam Churna 100g', brand: 'Zandu', pack: '100g', mrp: 95, price: 85, description: 'Herbal laxative churna for constipation relief without griping.', catSlug: 'ayurvedic' },
  { name: 'Zandu Kesari Jivan 900g', brand: 'Zandu', pack: '900g', mrp: 495, price: 445, description: 'Chyawanprash with saffron for enhanced immunity and energy.', catSlug: 'ayurvedic' },
  { name: 'Zandu Lalima Blood Purifier 200ml', brand: 'Zandu', pack: '200ml', mrp: 140, price: 126, description: 'Herbal blood purifier syrup with neem, manjishtha and sariva.', catSlug: 'liquids' },
  { name: 'Zandu Vigorex Gold Capsules 20 Caps', brand: 'Zandu', pack: '20 Caps', mrp: 460, price: 414, description: 'Ayurvedic vitality capsules with gold bhasma, ashwagandha and safed musli.', catSlug: 'ayurvedic' },
  { name: 'Zandu Honey 500g', brand: 'Zandu', pack: '500g', mrp: 249, price: 224, description: 'Pure natural honey tested for purity. No added sugar.', catSlug: 'fmcg' },
  { name: 'Zandu Triphala Tablets 60 Tabs', brand: 'Zandu', pack: '60 Tabs', mrp: 130, price: 117, description: 'Triphala tablets for digestive health and gentle detoxification.', catSlug: 'ayurvedic' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  BAIDYANATH                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */
const BAIDYANATH = [
  { name: 'Baidyanath Chyawanprash Special 1kg', brand: 'Baidyanath', pack: '1kg', mrp: 350, price: 315, description: 'Ayurvedic chyawanprash with 52 herbs for immunity, energy and digestion.', catSlug: 'ayurvedic' },
  { name: 'Baidyanath Shankhpushpi Syrup 200ml', brand: 'Baidyanath', pack: '200ml', mrp: 120, price: 108, description: 'Brain tonic syrup for memory, concentration and mental performance.', catSlug: 'liquids' },
  { name: 'Baidyanath Ashwagandha Churna 100g', brand: 'Baidyanath', pack: '100g', mrp: 150, price: 135, description: 'Pure ashwagandha powder for stress relief, strength and vitality.', catSlug: 'ayurvedic' },
  { name: 'Baidyanath Triphala Juice 1L', brand: 'Baidyanath', pack: '1L', mrp: 230, price: 207, description: 'Fresh triphala juice for digestive health and detoxification.', catSlug: 'liquids' },
  { name: 'Baidyanath Giloy Juice 500ml', brand: 'Baidyanath', pack: '500ml', mrp: 180, price: 162, description: 'Giloy ras for boosting immunity and fever management.', catSlug: 'liquids' },
  { name: 'Baidyanath Mahanarayan Oil 200ml', brand: 'Baidyanath', pack: '200ml', mrp: 220, price: 198, description: 'Ayurvedic pain relief oil for joint pain, arthritis and body aches.', catSlug: 'ayurvedic' },
  { name: 'Baidyanath Sitopaladi Churna 60g', brand: 'Baidyanath', pack: '60g', mrp: 115, price: 103, description: 'Classic ayurvedic churna for cough, cold and respiratory health.', catSlug: 'ayurvedic' },
  { name: 'Baidyanath Vita-Ex Gold Plus 20 Caps', brand: 'Baidyanath', pack: '20 Caps', mrp: 495, price: 445, description: 'Gold & shilajit capsules for stamina, strength and vitality.', catSlug: 'ayurvedic' },
  { name: 'Baidyanath Amla Juice 1L', brand: 'Baidyanath', pack: '1L', mrp: 200, price: 180, description: 'Pure amla juice rich in vitamin C for immunity and skin health.', catSlug: 'liquids' },
  { name: 'Baidyanath Isabgol 100g', brand: 'Baidyanath', pack: '100g', mrp: 140, price: 126, description: 'Pure psyllium husk for constipation relief and digestive health.', catSlug: 'ayurvedic' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HAMDARD                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */
const HAMDARD = [
  { name: 'Hamdard Rooh Afza Sharbat 750ml', brand: 'Hamdard', pack: '750ml', mrp: 175, price: 157, description: 'India iconic rose-based herbal sharbat. Cooling summer drink since 1907.', catSlug: 'liquids' },
  { name: 'Hamdard Safi Blood Purifier 200ml', brand: 'Hamdard', pack: '200ml', mrp: 140, price: 126, description: 'Unani blood purifier syrup for acne, pimples and skin problems.', catSlug: 'liquids' },
  { name: 'Hamdard Safi Blood Purifier 500ml', brand: 'Hamdard', pack: '500ml', mrp: 285, price: 256, description: 'Herbal blood cleanser with neem and chirata for clear skin from within.', catSlug: 'liquids' },
  { name: 'Hamdard Joshanda (Sachet Pack of 5)', brand: 'Hamdard', pack: '5 sachets', mrp: 60, price: 54, description: 'Herbal tea remedy for cold, cough, flu and sore throat.', catSlug: 'ayurvedic' },
  { name: 'Hamdard Cinkara Tonic 200ml', brand: 'Hamdard', pack: '200ml', mrp: 125, price: 112, description: 'Restorative health tonic with vitamins and minerals for general weakness.', catSlug: 'liquids' },
  { name: 'Hamdard Roghan Badam Shirin 100ml', brand: 'Hamdard', pack: '100ml', mrp: 280, price: 252, description: 'Sweet almond oil for brain health, skin glow and hair nourishment.', catSlug: 'fmcg' },
  { name: 'Hamdard Naunehal Gripe Water 130ml', brand: 'Hamdard', pack: '130ml', mrp: 55, price: 49, description: 'Herbal gripe water for baby colic, gas and digestive discomfort.', catSlug: 'liquids' },
  { name: 'Hamdard Pachnol 50g', brand: 'Hamdard', pack: '50g', mrp: 80, price: 72, description: 'Digestive powder for gastric troubles, flatulence and indigestion.', catSlug: 'ayurvedic' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CIPLA HEALTH (OTC)                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */
const CIPLA = [
  { name: 'Cipla Nicotex 2mg Nicotine Gum (Pack of 10)', brand: 'Cipla', pack: '10 Gums', mrp: 120, price: 108, description: 'Nicotine replacement gum for quitting smoking. Mint flavour.', catSlug: 'fmcg' },
  { name: 'Cipla Nicotex 4mg Nicotine Gum (Pack of 10)', brand: 'Cipla', pack: '10 Gums', mrp: 155, price: 139, description: 'Higher strength nicotine gum for heavy smokers. Fresh mint.', catSlug: 'fmcg' },
  { name: 'Cipla Mamaxpert Intimate Wash 100ml', brand: 'Cipla', pack: '100ml', mrp: 199, price: 179, description: 'pH balanced intimate hygiene wash with tea tree oil and lactic acid.', catSlug: 'fmcg' },
  { name: 'Cipla Maxirich Multivitamin 30 Caps', brand: 'Cipla', pack: '30 Caps', mrp: 225, price: 202, description: 'Daily multivitamin softgel with 13 vitamins and 8 minerals.', catSlug: 'softgel-capsules' },
  { name: 'Cipla Omnigel Pain Relief Gel 30g', brand: 'Cipla', pack: '30g', mrp: 108, price: 97, description: 'Diclofenac-based pain relief gel for muscle and joint pain.', catSlug: 'cream-ointment' },
  { name: 'Cipla Omnigel Pain Relief Spray 75g', brand: 'Cipla', pack: '75g', mrp: 225, price: 202, description: 'Fast-acting pain relief spray for quick muscle pain relief.', catSlug: 'fmcg' },
  { name: 'Cipla i-Pill Emergency Contraceptive Pill', brand: 'Cipla', pack: '1 Tab', mrp: 100, price: 90, description: 'Emergency contraceptive pill (levonorgestrel 1.5mg). Use within 72 hours.', catSlug: 'caps-tabs' },
  { name: 'Cipla Tugain 5% Solution 60ml', brand: 'Cipla', pack: '60ml', mrp: 699, price: 629, description: 'Minoxidil 5% topical solution for male pattern hair loss. Promotes regrowth.', catSlug: 'liquids', rx: false },
  { name: 'Cipla MamaXpert Stretch Mark Cream 100g', brand: 'Cipla', pack: '100g', mrp: 499, price: 449, description: 'Stretch mark prevention cream with cocoa butter and vitamin E.', catSlug: 'cream-ointment' },
  { name: 'Cipla Acne-Free Face Wash 60ml', brand: 'Cipla', pack: '60ml', mrp: 160, price: 144, description: 'Salicylic acid face wash for acne management. Oil-free gentle formula.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DR. MOREPEN                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */
const MOREPEN = [
  { name: 'Dr. Morepen Gluco One BG-03 Glucometer Kit', brand: 'Dr. Morepen', pack: '1 Kit', mrp: 1850, price: 999, description: 'Digital blood glucose monitoring system with 25 free strips.', catSlug: 'pharma-misc' },
  { name: 'Dr. Morepen Gluco One BG-03 Test Strips 50s', brand: 'Dr. Morepen', pack: '50 Strips', mrp: 800, price: 549, description: 'Blood glucose test strips compatible with Dr. Morepen BG-03 glucometer.', catSlug: 'pharma-misc' },
  { name: 'Dr. Morepen BP-02 Blood Pressure Monitor', brand: 'Dr. Morepen', pack: '1 Unit', mrp: 2499, price: 1499, description: 'Digital blood pressure monitor with memory function and irregular heartbeat detection.', catSlug: 'pharma-misc' },
  { name: 'Dr. Morepen Pulse Oximeter PO-04', brand: 'Dr. Morepen', pack: '1 Unit', mrp: 2500, price: 999, description: 'Fingertip pulse oximeter for SpO2 and pulse rate measurement. OLED display.', catSlug: 'pharma-misc' },
  { name: 'Dr. Morepen Digital Thermometer MT-111', brand: 'Dr. Morepen', pack: '1 Unit', mrp: 199, price: 149, description: 'Fast reading digital thermometer with beeper alert. Water resistant tip.', catSlug: 'pharma-misc' },
  { name: 'Dr. Morepen Weighing Scale MS-111', brand: 'Dr. Morepen', pack: '1 Unit', mrp: 1299, price: 799, description: 'Tempered glass digital weighing scale with high precision sensors.', catSlug: 'pharma-misc' },
  { name: 'Dr. Morepen Omega 3 Fish Oil 1000mg 30 Softgels', brand: 'Dr. Morepen', pack: '30 Softgels', mrp: 599, price: 449, description: 'Omega 3 fatty acids (EPA + DHA) for heart, brain and joint health.', catSlug: 'softgel-capsules' },
  { name: 'Dr. Morepen Multivitamin 30 Tabs', brand: 'Dr. Morepen', pack: '30 Tabs', mrp: 399, price: 299, description: 'Complete daily multivitamin with vitamins A to K plus minerals.', catSlug: 'caps-tabs' },
  { name: 'Dr. Morepen Biotin 10000mcg 60 Tabs', brand: 'Dr. Morepen', pack: '60 Tabs', mrp: 499, price: 374, description: 'High potency biotin tablets for healthy hair, skin and nails.', catSlug: 'caps-tabs' },
  { name: 'Dr. Morepen N95 Face Mask (Pack of 5)', brand: 'Dr. Morepen', pack: '5 pcs', mrp: 299, price: 199, description: 'N95 grade anti-pollution face mask with 5-layer filtration.', catSlug: 'pharma-misc' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  EMAMI                                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
const EMAMI = [
  { name: 'Emami Navratna Cool Talc 400g', brand: 'Emami', pack: '400g', mrp: 240, price: 216, description: 'Ayurvedic cooling talc with 9 herbal ingredients for all-day freshness.', catSlug: 'powder' },
  { name: 'Emami Navratna Oil 200ml', brand: 'Emami', pack: '200ml', mrp: 155, price: 139, description: 'Cooling ayurvedic hair oil with 9 herbal ingredients for headache and stress relief.', catSlug: 'fmcg' },
  { name: 'Emami 7 Oils In One Non-Sticky Hair Oil 200ml', brand: 'Emami', pack: '200ml', mrp: 200, price: 180, description: 'Blend of 7 oils — coconut, almond, argan, jojoba, walnut, amla, olive. Non-sticky.', catSlug: 'fmcg' },
  { name: 'Emami Fair & Handsome Fairness Cream 60g', brand: 'Emami', pack: '60g', mrp: 199, price: 179, description: 'Fairness cream for men with vitamin B3, lycopene and skin lightening complex.', catSlug: 'cream-ointment' },
  { name: 'Emami BoroPlus Haldi Chandan Antiseptic Face Wash 100ml', brand: 'Emami', pack: '100ml', mrp: 120, price: 108, description: 'Antiseptic face wash with turmeric and sandalwood for clear skin.', catSlug: 'fmcg' },
  { name: 'Emami Mentho Plus Balm 9ml', brand: 'Emami', pack: '9ml', mrp: 35, price: 31, description: 'Strong pain balm with menthol for instant relief from headache and cold.', catSlug: 'cream-ointment' },
  { name: 'Emami Kesh King Anti-Hairfall Shampoo 200ml', brand: 'Emami', pack: '200ml', mrp: 250, price: 225, description: 'Ayurvedic shampoo with 21 herbs for reducing hair fall.', catSlug: 'fmcg' },
  { name: 'Emami Kesh King Scalp & Hair Medicine Oil 300ml', brand: 'Emami', pack: '300ml', mrp: 480, price: 432, description: 'Medicinal hair oil with 21 ayurvedic herbs. Reduces hair fall in 14 days.', catSlug: 'fmcg' },
  { name: 'Emami Malai Kesar Cold Cream 60ml', brand: 'Emami', pack: '60ml', mrp: 99, price: 89, description: 'Winter cold cream with malai and kesar for soft, glowing skin in dry weather.', catSlug: 'cream-ointment' },
  { name: 'Emami Naturally Fair Herbal Fairness Cream 50ml', brand: 'Emami', pack: '50ml', mrp: 120, price: 108, description: 'Herbal fairness cream with saffron, turmeric and aloe for natural glow.', catSlug: 'cream-ointment' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  VASELINE                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
const VASELINE = [
  { name: 'Vaseline Intensive Care Deep Moisture Body Lotion 200ml', brand: 'Vaseline', pack: '200ml', mrp: 229, price: 206, description: 'Deep moisture body lotion with micro-droplets of Vaseline jelly for dry skin.', catSlug: 'lotion' },
  { name: 'Vaseline Intensive Care Deep Moisture Body Lotion 400ml', brand: 'Vaseline', pack: '400ml', mrp: 389, price: 350, description: 'Healing micro-droplets of petroleum jelly for intensive skin repair.', catSlug: 'lotion' },
  { name: 'Vaseline Intensive Care Cocoa Glow Body Lotion 200ml', brand: 'Vaseline', pack: '200ml', mrp: 229, price: 206, description: 'Body lotion with pure cocoa butter for naturally glowing skin.', catSlug: 'lotion' },
  { name: 'Vaseline Petroleum Jelly Original 100g', brand: 'Vaseline', pack: '100g', mrp: 160, price: 144, description: 'Original 100% pure petroleum jelly. Triple-purified for skin protection.', catSlug: 'cream-ointment' },
  { name: 'Vaseline Petroleum Jelly Original 250g', brand: 'Vaseline', pack: '250g', mrp: 310, price: 279, description: 'Large size pure petroleum jelly for cracked heels, dry lips and skin.', catSlug: 'cream-ointment' },
  { name: 'Vaseline Lip Therapy Rosy Lips 7g', brand: 'Vaseline', pack: '7g', mrp: 199, price: 179, description: 'Tinted lip balm with rose and almond oil for soft rosy lips.', catSlug: 'fmcg' },
  { name: 'Vaseline Healthy White Sun + Pollution Protection Lotion 200ml', brand: 'Vaseline', pack: '200ml', mrp: 275, price: 247, description: 'Daily body lotion with SPF and pollution protection for brighter skin.', catSlug: 'lotion' },
  { name: 'Vaseline Intensive Care Aloe Fresh Body Lotion 200ml', brand: 'Vaseline', pack: '200ml', mrp: 229, price: 206, description: 'Lightweight non-greasy body lotion with aloe vera for normal skin.', catSlug: 'lotion' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DOVE                                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
const DOVE = [
  { name: 'Dove Cream Beauty Bathing Bar 100g', brand: 'Dove', pack: '100g', mrp: 58, price: 52, description: 'Moisturising beauty bar with 1/4 moisturising cream for softer skin.', catSlug: 'fmcg' },
  { name: 'Dove Cream Beauty Bathing Bar 100g (Pack of 3)', brand: 'Dove', pack: '3x100g', mrp: 174, price: 156, description: 'Value pack of 3 Dove beauty bars. Gentle cleansing with moisturising cream.', catSlug: 'fmcg' },
  { name: 'Dove Deeply Nourishing Body Wash 250ml', brand: 'Dove', pack: '250ml', mrp: 199, price: 179, description: 'Moisturising body wash with NutriumMoisture technology for soft skin.', catSlug: 'fmcg' },
  { name: 'Dove Intense Repair Shampoo 340ml', brand: 'Dove', pack: '340ml', mrp: 289, price: 260, description: 'Keratin repair shampoo for damaged hair. Repairs from root to tip.', catSlug: 'fmcg' },
  { name: 'Dove Hair Fall Rescue Shampoo 340ml', brand: 'Dove', pack: '340ml', mrp: 289, price: 260, description: 'Nutrilock actives shampoo to nourish hair roots and reduce hair fall.', catSlug: 'fmcg' },
  { name: 'Dove Dryness Care Conditioner 180ml', brand: 'Dove', pack: '180ml', mrp: 185, price: 166, description: 'Intense moisture conditioner for rough, dry and frizzy hair.', catSlug: 'fmcg' },
  { name: 'Dove Intense Repair Hair Mask 300ml', brand: 'Dove', pack: '300ml', mrp: 599, price: 539, description: 'Deep conditioning hair mask with keratin for smooth, shiny hair.', catSlug: 'fmcg' },
  { name: 'Dove Men+Care Fresh Clean 2-in-1 Shampoo 340ml', brand: 'Dove', pack: '340ml', mrp: 329, price: 296, description: 'Men shampoo + conditioner with caffeine and menthol for thick strong hair.', catSlug: 'fmcg' },
  { name: 'Dove Elixir Nourished Shine Hair Oil 90ml', brand: 'Dove', pack: '90ml', mrp: 250, price: 225, description: 'Lightweight hair oil with camellia oil for instant nourish and shine.', catSlug: 'fmcg' },
  { name: 'Dove Fresh Moisture Beauty Bar 100g', brand: 'Dove', pack: '100g', mrp: 58, price: 52, description: 'Fresh and moisture beauty bar with cucumber and green tea for hydration.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  LIFEBUOY                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
const LIFEBUOY = [
  { name: 'Lifebuoy Total 10 Soap 125g', brand: 'Lifebuoy', pack: '125g', mrp: 42, price: 37, description: 'Germ protection soap that kills 99.9% germs. Silver shield formula.', catSlug: 'fmcg' },
  { name: 'Lifebuoy Total 10 Soap 125g (Pack of 4)', brand: 'Lifebuoy', pack: '4x125g', mrp: 160, price: 144, description: 'Value pack for complete family germ protection.', catSlug: 'fmcg' },
  { name: 'Lifebuoy Nature Soap 125g', brand: 'Lifebuoy', pack: '125g', mrp: 42, price: 37, description: 'Germ protection with neem and lemongrass. 100% better germ protection.', catSlug: 'fmcg' },
  { name: 'Lifebuoy Handwash Total 10 190ml', brand: 'Lifebuoy', pack: '190ml', mrp: 85, price: 76, description: 'Antibacterial liquid handwash. 10x better germ protection.', catSlug: 'fmcg' },
  { name: 'Lifebuoy Handwash Total 10 Refill 750ml', brand: 'Lifebuoy', pack: '750ml', mrp: 155, price: 139, description: 'Economical refill pack for Lifebuoy handwash pump.', catSlug: 'fmcg' },
  { name: 'Lifebuoy Body Wash Total 10 250ml', brand: 'Lifebuoy', pack: '250ml', mrp: 165, price: 148, description: 'Germ protection body wash with activated silver formula.', catSlug: 'fmcg' },
  { name: 'Lifebuoy Hand Sanitizer 500ml', brand: 'Lifebuoy', pack: '500ml', mrp: 200, price: 180, description: 'Alcohol-based hand sanitizer for 99.99% germ kill without water.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SAVLON                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */
const SAVLON = [
  { name: 'Savlon Antiseptic Liquid 200ml', brand: 'Savlon', pack: '200ml', mrp: 125, price: 112, description: 'Multipurpose antiseptic liquid for first aid, personal hygiene and household use.', catSlug: 'liquids' },
  { name: 'Savlon Antiseptic Liquid 500ml', brand: 'Savlon', pack: '500ml', mrp: 240, price: 216, description: 'Chlorhexidine antiseptic for wounds, cuts and protection from infections.', catSlug: 'liquids' },
  { name: 'Savlon Antiseptic Liquid 1000ml', brand: 'Savlon', pack: '1000ml', mrp: 368, price: 331, description: 'Family-size antiseptic liquid for cleaning wounds and daily hygiene.', catSlug: 'liquids' },
  { name: 'Savlon Antiseptic Cream 30g', brand: 'Savlon', pack: '30g', mrp: 80, price: 72, description: 'Antiseptic wound healing cream for cuts, grazes and minor burns.', catSlug: 'cream-ointment' },
  { name: 'Savlon Moisture Shield Handwash 200ml', brand: 'Savlon', pack: '200ml', mrp: 105, price: 94, description: 'Germ-protection handwash with moisturising formula for soft hands.', catSlug: 'fmcg' },
  { name: 'Savlon Hexa Advanced Hand Sanitizer 500ml', brand: 'Savlon', pack: '500ml', mrp: 250, price: 225, description: 'Advanced hand sanitizer gel with 72% alcohol for superb germ protection.', catSlug: 'fmcg' },
  { name: 'Savlon Nimbu Soap 75g (Pack of 4)', brand: 'Savlon', pack: '4x75g', mrp: 120, price: 108, description: 'Lemon-scented germ protection soap for fresh clean skin.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  BETADINE                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
const BETADINE = [
  { name: 'Betadine Antiseptic Solution 50ml', brand: 'Betadine', pack: '50ml', mrp: 85, price: 76, description: 'Povidone-iodine antiseptic solution for wound cleansing and disinfection.', catSlug: 'liquids' },
  { name: 'Betadine Antiseptic Solution 100ml', brand: 'Betadine', pack: '100ml', mrp: 142, price: 127, description: 'Broad-spectrum antiseptic effective against bacteria, viruses and fungi.', catSlug: 'liquids' },
  { name: 'Betadine Antiseptic Solution 500ml', brand: 'Betadine', pack: '500ml', mrp: 460, price: 414, description: 'Hospital-grade antiseptic for wound management and infection prevention.', catSlug: 'liquids' },
  { name: 'Betadine Ointment 15g', brand: 'Betadine', pack: '15g', mrp: 70, price: 63, description: 'Povidone-iodine ointment for minor cuts, burns and wound infections.', catSlug: 'cream-ointment' },
  { name: 'Betadine Gargle & Mouthwash 100ml', brand: 'Betadine', pack: '100ml', mrp: 175, price: 157, description: 'Povidone-iodine gargle for sore throat, mouth ulcers and gum infections.', catSlug: 'liquids' },
  { name: 'Betadine Feminine Wash 50ml', brand: 'Betadine', pack: '50ml', mrp: 120, price: 108, description: 'Intimate wash with natural prebiotics for feminine hygiene.', catSlug: 'fmcg' },
  { name: 'Betadine Cold Defence Nasal Spray 20ml', brand: 'Betadine', pack: '20ml', mrp: 399, price: 359, description: 'Nasal spray that traps and kills cold and flu viruses. Iota-carrageenan formula.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  JOHNSON & JOHNSON (Baby / First Aid)                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
const JNJ = [
  { name: 'Johnson Baby Shampoo 200ml', brand: 'Johnson & Johnson', pack: '200ml', mrp: 230, price: 207, description: 'No More Tears baby shampoo. Clinically proven mild and gentle formula.', catSlug: 'fmcg' },
  { name: 'Johnson Baby Shampoo 500ml', brand: 'Johnson & Johnson', pack: '500ml', mrp: 520, price: 468, description: 'No More Tears gentle shampoo for baby. As gentle as pure water.', catSlug: 'fmcg' },
  { name: 'Johnson Baby Oil 200ml', brand: 'Johnson & Johnson', pack: '200ml', mrp: 215, price: 193, description: 'Pure mineral baby oil for moisturising baby skin. 10x more moisture.', catSlug: 'fmcg' },
  { name: 'Johnson Baby Powder 200g', brand: 'Johnson & Johnson', pack: '200g', mrp: 200, price: 180, description: 'Classic baby powder for soft and smooth baby skin. Clinically mild.', catSlug: 'powder' },
  { name: 'Johnson Baby Cream 100g', brand: 'Johnson & Johnson', pack: '100g', mrp: 185, price: 166, description: 'Rich moisturising cream for baby with coconut oil and milk protein.', catSlug: 'cream-ointment' },
  { name: 'Johnson Baby Lotion 200ml', brand: 'Johnson & Johnson', pack: '200ml', mrp: 255, price: 229, description: 'Gentle daily baby lotion for 24-hour moisture. Paraben-free.', catSlug: 'lotion' },
  { name: 'Johnson Baby Top to Toe Bath 200ml', brand: 'Johnson & Johnson', pack: '200ml', mrp: 245, price: 220, description: 'Head to toe baby wash for gentle full body cleansing.', catSlug: 'fmcg' },
  { name: 'Johnson Baby Soap 75g (Pack of 3)', brand: 'Johnson & Johnson', pack: '3x75g', mrp: 160, price: 144, description: 'Baby soap with 1/4 baby lotion for soft clean baby skin.', catSlug: 'fmcg' },
  { name: 'Johnson Baby Diaper Rash Cream 40g', brand: 'Johnson & Johnson', pack: '40g', mrp: 195, price: 175, description: 'Zinc oxide-based diaper rash cream. Heals and protects from rash.', catSlug: 'cream-ointment' },
  { name: 'Johnson Baby Bedtime Lotion 200ml', brand: 'Johnson & Johnson', pack: '200ml', mrp: 310, price: 279, description: 'Calming NaturalCalm aroma lotion for better sleep routine.', catSlug: 'lotion' },
  { name: 'Band-Aid Flexible Fabric (Pack of 100)', brand: 'Johnson & Johnson', pack: '100 pcs', mrp: 265, price: 238, description: 'Fabric adhesive bandages for wound protection. Stays on up to 24 hours.', catSlug: 'pharma-misc' },
  { name: 'Band-Aid Waterproof (Pack of 20)', brand: 'Johnson & Johnson', pack: '20 pcs', mrp: 120, price: 108, description: 'Waterproof adhesive bandages. Superior protection for active days.', catSlug: 'pharma-misc' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GARNIER                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */
const GARNIER = [
  { name: 'Garnier Skin Naturals Bright Complete Vitamin C Face Wash 150g', brand: 'Garnier', pack: '150g', mrp: 230, price: 207, description: 'Vitamin C face wash for bright, spot-free skin. With Japanese yuzu lemon.', catSlug: 'fmcg' },
  { name: 'Garnier Skin Naturals Bright Complete Vitamin C Serum Cream 45g', brand: 'Garnier', pack: '45g', mrp: 199, price: 179, description: 'Vitamin C serum cream for dark spots and even tone. SPF 40 PA+++.', catSlug: 'cream-ointment' },
  { name: 'Garnier Skin Naturals Bright Complete Vitamin C Serum 30ml', brand: 'Garnier', pack: '30ml', mrp: 399, price: 359, description: '30X Vitamin C serum for bright spotless skin in 3 days.', catSlug: 'cream-ointment' },
  { name: 'Garnier Men Oil Clear Face Wash 100g', brand: 'Garnier', pack: '100g', mrp: 195, price: 175, description: 'Oil-clear face wash with clay D for deep cleansing and oil control for men.', catSlug: 'fmcg' },
  { name: 'Garnier Micellar Cleansing Water 125ml', brand: 'Garnier', pack: '125ml', mrp: 250, price: 225, description: 'All-in-one makeup remover and cleanser. No rinse required.', catSlug: 'fmcg' },
  { name: 'Garnier Micellar Cleansing Water 400ml', brand: 'Garnier', pack: '400ml', mrp: 499, price: 449, description: 'Large size micellar water for gentle yet effective makeup removal.', catSlug: 'fmcg' },
  { name: 'Garnier Fructis Shampoo Long & Strong 340ml', brand: 'Garnier', pack: '340ml', mrp: 255, price: 229, description: 'Strengthening shampoo with active fruit protein and vitamins B3, B6.', catSlug: 'fmcg' },
  { name: 'Garnier Ultra Blends Mythic Olive Shampoo 340ml', brand: 'Garnier', pack: '340ml', mrp: 255, price: 229, description: 'Olive oil shampoo for dry and fizzy hair. Nourishes and tames frizz.', catSlug: 'fmcg' },
  { name: 'Garnier Color Naturals Shade 1 Natural Black', brand: 'Garnier', pack: '1 Pack', mrp: 150, price: 135, description: 'Nourishing permanent hair colour with olive oil, avocado and shea.', catSlug: 'fmcg' },
  { name: 'Garnier Skin Naturals Green Tea Face Mask Sheet', brand: 'Garnier', pack: '1 Mask', mrp: 99, price: 89, description: 'Hydra-bomb green tea face sheet mask for purifying and oil control.', catSlug: 'fmcg' },
  { name: 'Garnier Bright Complete Eye Roll On 15ml', brand: 'Garnier', pack: '15ml', mrp: 225, price: 202, description: 'Vitamin C eye roll-on to reduce dark circles with cooling metal tip.', catSlug: 'cream-ointment' },
  { name: 'Garnier Bright Complete Night Cream 40g', brand: 'Garnier', pack: '40g', mrp: 199, price: 179, description: 'Vitamin C and yoghurt night cream for overnight spot reduction.', catSlug: 'cream-ointment' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PEPSODENT                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */
const PEPSODENT = [
  { name: 'Pepsodent Germi Check Cavity Protection Toothpaste 200g', brand: 'Pepsodent', pack: '200g', mrp: 98, price: 88, description: 'Cavity protection toothpaste that fights germs even after brushing.', catSlug: 'fmcg' },
  { name: 'Pepsodent 2 in 1 Cavity Protection Toothpaste 150g', brand: 'Pepsodent', pack: '150g', mrp: 85, price: 76, description: 'Toothpaste + mouthwash in one for germi check cavity protection.', catSlug: 'fmcg' },
  { name: 'Pepsodent Expert Protection Complete Toothpaste 140g', brand: 'Pepsodent', pack: '140g', mrp: 135, price: 121, description: 'Complete dental protection with fluoride and zinc citrate.', catSlug: 'fmcg' },
  { name: 'Pepsodent Sensitive Expert Protection Toothpaste 70g', brand: 'Pepsodent', pack: '70g', mrp: 115, price: 103, description: 'HAP formula for instant sensitivity relief with expert-level protection.', catSlug: 'fmcg' },
  { name: 'Pepsodent Centre Fresh Toothpaste 150g', brand: 'Pepsodent', pack: '150g', mrp: 108, price: 97, description: 'Gel toothpaste with liquid-filled centre for maximum freshness.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SUNSILK / CLINIC PLUS                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
const HAIRCARE_BRANDS = [
  { name: 'Sunsilk Lusciously Thick & Long Shampoo 340ml', brand: 'Sunsilk', pack: '340ml', mrp: 226, price: 203, description: 'Keratin yoghurt protein shampoo for thick and long hair.', catSlug: 'fmcg' },
  { name: 'Sunsilk Black Shine Shampoo 340ml', brand: 'Sunsilk', pack: '340ml', mrp: 226, price: 203, description: 'Shampoo with amla and oil for shiny black hair.', catSlug: 'fmcg' },
  { name: 'Sunsilk Hair Fall Solution Shampoo 340ml', brand: 'Sunsilk', pack: '340ml', mrp: 226, price: 203, description: 'Soy vitamin complex shampoo to nourish roots and reduce hair fall.', catSlug: 'fmcg' },
  { name: 'Sunsilk Stunning Black Shine Conditioner 180ml', brand: 'Sunsilk', pack: '180ml', mrp: 155, price: 139, description: 'Conditioner with amla and coconut oil for black shiny hair.', catSlug: 'fmcg' },
  { name: 'Clinic Plus Strong & Long Shampoo 355ml', brand: 'Clinic Plus', pack: '355ml', mrp: 195, price: 175, description: 'Milk protein shampoo 10x stronger hair from first wash.', catSlug: 'fmcg' },
  { name: 'Clinic Plus Strong & Long Shampoo 175ml', brand: 'Clinic Plus', pack: '175ml', mrp: 110, price: 99, description: 'Strengthening shampoo with milk proteins and multivitamins.', catSlug: 'fmcg' },
  { name: 'Clinic Plus Strong & Long Health Shampoo 650ml', brand: 'Clinic Plus', pack: '650ml', mrp: 345, price: 310, description: 'Family-size strengthening shampoo for 10x stronger hair.', catSlug: 'fmcg' },
  { name: 'Clinic Plus Strength & Shine Conditioner 175ml', brand: 'Clinic Plus', pack: '175ml', mrp: 130, price: 117, description: 'Conditioner with egg protein for strong shiny hair.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SANTOOR / YARDLEY                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */
const SANTOOR_YARDLEY = [
  { name: 'Santoor Sandal & Turmeric Soap 125g (Pack of 4)', brand: 'Santoor', pack: '4x125g', mrp: 167, price: 150, description: 'Sandal & turmeric soap for total skin care and germ protection.', catSlug: 'fmcg' },
  { name: 'Santoor Gold Soap 75g (Pack of 4)', brand: 'Santoor', pack: '4x75g', mrp: 128, price: 115, description: 'Soap with saffron and sandalwood for golden glow.', catSlug: 'fmcg' },
  { name: 'Santoor Baby Soap 75g (Pack of 3)', brand: 'Santoor', pack: '3x75g', mrp: 105, price: 94, description: 'Gentle baby soap with sandalwood and turmeric. Dermatologically tested.', catSlug: 'fmcg' },
  { name: 'Santoor Handwash Gentle Fresh 200ml', brand: 'Santoor', pack: '200ml', mrp: 85, price: 76, description: 'Anti-bacterial handwash with neem and lotus. Protects from 100 illness causing germs.', catSlug: 'fmcg' },
  { name: 'Yardley London English Lavender Soap 100g', brand: 'Yardley', pack: '100g', mrp: 99, price: 89, description: 'Luxury soap enriched with English lavender essential oil.', catSlug: 'fmcg' },
  { name: 'Yardley London Gentleman Urbane Deodorant 150ml', brand: 'Yardley', pack: '150ml', mrp: 225, price: 202, description: 'Premium deodorant body spray with sophisticated urbane fragrance.', catSlug: 'fmcg' },
  { name: 'Yardley English Rose Compact Perfume 18ml', brand: 'Yardley', pack: '18ml', mrp: 299, price: 269, description: 'Pocket-size perfume spray with classic English rose fragrance.', catSlug: 'fmcg' },
  { name: 'Yardley London Gentleman Legend Talc 250g', brand: 'Yardley', pack: '250g', mrp: 225, price: 202, description: 'Premium talcum powder with woody fragrance for men.', catSlug: 'powder' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SUN PHARMA / ABBOTT / GSK OTC                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
const PHARMA_OTC = [
  { name: 'Crocin Advance 500mg 15 Tabs', brand: 'GSK', pack: '15 Tabs', mrp: 32, price: 28, description: 'Paracetamol 500mg tablets for headache, fever and body pain relief.', catSlug: 'caps-tabs' },
  { name: 'Crocin 650 Advance 15 Tabs', brand: 'GSK', pack: '15 Tabs', mrp: 35, price: 31, description: 'Higher strength paracetamol 650mg for faster relief from fever and pain.', catSlug: 'caps-tabs' },
  { name: 'Combiflam Plus 10 Tabs', brand: 'Sanofi', pack: '10 Tabs', mrp: 45, price: 40, description: 'Ibuprofen + paracetamol combination for joint pain, headache and toothache.', catSlug: 'caps-tabs' },
  { name: 'Disprin Regular 10 Tabs', brand: 'Reckitt', pack: '10 Tabs', mrp: 18, price: 16, description: 'Aspirin effervescent tablets for quick headache and pain relief.', catSlug: 'caps-tabs' },
  { name: 'Digene Antacid Gel 200ml (Orange)', brand: 'Abbott', pack: '200ml', mrp: 135, price: 121, description: 'Antacid gel for quick relief from acidity, gas and heartburn.', catSlug: 'liquids' },
  { name: 'Digene Tablets (Orange) 15 Tabs', brand: 'Abbott', pack: '15 Tabs', mrp: 48, price: 43, description: 'Chewable antacid tablets for anytime acidity relief.', catSlug: 'caps-tabs' },
  { name: 'Eno Fruit Salt Sachet 5g (Pack of 30)', brand: 'GSK', pack: '30 sachets', mrp: 150, price: 135, description: 'Fast-acting antacid powder for quick relief from acidity in 6 seconds.', catSlug: 'powder' },
  { name: 'Gelusil MPS Suspension 200ml', brand: 'Pfizer', pack: '200ml', mrp: 120, price: 108, description: 'Antacid + anti-flatulent suspension for acidity, gas and bloating.', catSlug: 'liquids' },
  { name: 'ORS Electral Powder (Pack of 20)', brand: 'FDC', pack: '20 sachets', mrp: 130, price: 117, description: 'WHO formula oral rehydration salts for dehydration prevention.', catSlug: 'powder' },
  { name: 'Iodex Fast Relief Cream 40g', brand: 'GSK', pack: '40g', mrp: 75, price: 67, description: 'Multi-action formula for muscle pain, joint pain and sprain relief.', catSlug: 'cream-ointment' },
  { name: 'Iodex UltraGel 30g', brand: 'GSK', pack: '30g', mrp: 105, price: 94, description: 'Diclofenac-based transparent gel for deep tissue pain relief.', catSlug: 'cream-ointment' },
  { name: 'Burnol Antiseptic Cream 20g', brand: 'Dr. Morepen', pack: '20g', mrp: 72, price: 64, description: 'Antiseptic burn cream for quick healing of minor burns and scalds.', catSlug: 'cream-ointment' },
  { name: 'Boroline Antiseptic Ayurvedic Cream 20g', brand: 'Boroline', pack: '20g', mrp: 48, price: 43, description: 'Iconic antiseptic cream since 1929. For cuts, burns and cracked skin.', catSlug: 'cream-ointment' },
  { name: 'Old Spice After Shave Lotion Original 150ml', brand: 'Old Spice', pack: '150ml', mrp: 395, price: 355, description: 'Classic after-shave lotion for a refreshing post-shave feel.', catSlug: 'lotion' },
  { name: 'Old Spice Deodorant Spray Original 150ml', brand: 'Old Spice', pack: '150ml', mrp: 265, price: 238, description: 'Iconic fragrance deodorant body spray with lasting freshness.', catSlug: 'fmcg' },
  { name: 'Dolo 650 Tablets 15s', brand: 'Micro Labs', pack: '15 Tabs', mrp: 32, price: 28, description: 'Paracetamol 650mg tablets for fever, headache and body pain.', catSlug: 'caps-tabs' },
  { name: 'Strepsils Orange 12s', brand: 'Reckitt', pack: '12 Lozenges', mrp: 99, price: 89, description: 'Sore throat lozenges with amylmetacresol for throat relief.', catSlug: 'fmcg' },
  { name: 'Pudin Hara Pearls 10 Caps', brand: 'Dabur', pack: '10 Caps', mrp: 42, price: 37, description: 'Peppermint oil capsules for instant relief from gas and indigestion.', catSlug: 'caps-tabs' },
  { name: 'Hajmola Regular 120 Tabs', brand: 'Dabur', pack: '120 Tabs', mrp: 60, price: 54, description: 'Digestive tablets with hing, jeera and black pepper for taste and digestion.', catSlug: 'caps-tabs' },
  { name: 'Becosules Capsules 20 Caps', brand: 'Pfizer', pack: '20 Caps', mrp: 31, price: 27, description: 'B-complex and vitamin C capsules for energy, immunity and mouth ulcers.', catSlug: 'caps-tabs' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  LOTUS HERBALS                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */
const LOTUS = [
  { name: 'Lotus Herbals Whiteglow Skin Whitening Face Wash 100g', brand: 'Lotus Herbals', pack: '100g', mrp: 310, price: 279, description: 'Face wash with milk enzymes and Saxifraga extract for luminous skin.', catSlug: 'fmcg' },
  { name: 'Lotus Herbals Safe Sun UV Screen SPF 50 100g', brand: 'Lotus Herbals', pack: '100g', mrp: 625, price: 562, description: 'Matte gel sunscreen with SPF 50 PA+++ for oil-free sun protection.', catSlug: 'cream-ointment' },
  { name: 'Lotus Herbals Whiteglow Gel Cream SPF 25 60g', brand: 'Lotus Herbals', pack: '60g', mrp: 545, price: 490, description: 'Skin whitening and brightening gel cream with SPF 25.', catSlug: 'cream-ointment' },
  { name: 'Lotus Herbals YouthRx Anti-Ageing Firming Face Cream 50g', brand: 'Lotus Herbals', pack: '50g', mrp: 795, price: 715, description: 'Anti-aging cream with Gineplex Youth Compound for firm skin.', catSlug: 'cream-ointment' },
  { name: 'Lotus Herbals Neemwash Neem & Clove Face Wash 120g', brand: 'Lotus Herbals', pack: '120g', mrp: 295, price: 265, description: 'Neem and clove face wash for purifying acne-prone skin.', catSlug: 'fmcg' },
  { name: 'Lotus Herbals 3-in-1 Matte Look Daily Sunblock SPF 40 100g', brand: 'Lotus Herbals', pack: '100g', mrp: 475, price: 427, description: 'Tinted sunscreen with SPF 40 for daily matte-look sun protection.', catSlug: 'cream-ointment' },
  { name: 'Lotus Herbals Teatree Wash Anti-Acne Face Wash 120g', brand: 'Lotus Herbals', pack: '120g', mrp: 260, price: 234, description: 'Tea tree and cinnamon face wash to control acne and prevent breakouts.', catSlug: 'fmcg' },
  { name: 'Lotus Herbals Jojoba Oil 100ml', brand: 'Lotus Herbals', pack: '100ml', mrp: 395, price: 355, description: 'Pure jojoba oil for deep moisturising, anti-aging and hair nourishment.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HIMALAYA WELLNESS (Supplements & OTC)                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
const HIMALAYA_WELLNESS = [
  { name: 'Himalaya Liv.52 Tablets 100s', brand: 'Himalaya', pack: '100 Tabs', mrp: 135, price: 121, description: 'Hepatoprotective herbal tablets for liver health and detoxification.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Liv.52 DS Tablets 60s', brand: 'Himalaya', pack: '60 Tabs', mrp: 165, price: 148, description: 'Double strength liver care tablets for enhanced hepatic protection.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Septilin Tablets 60s', brand: 'Himalaya', pack: '60 Tabs', mrp: 155, price: 139, description: 'Herbal immunity booster with guggul, guduchi and licorice.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Cystone Tablets 60s', brand: 'Himalaya', pack: '60 Tabs', mrp: 160, price: 144, description: 'Herbal tablets for kidney stone prevention and urinary tract health.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Ashvagandha Tablets 60s', brand: 'Himalaya', pack: '60 Tabs', mrp: 220, price: 198, description: 'Pure ashwagandha tablets for stress, anxiety relief and vitality.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Tentex Forte Tablets 10s', brand: 'Himalaya', pack: '10 Tabs', mrp: 115, price: 103, description: 'Herbal formula for improving male stamina and performance.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Brahmi Tablets 60s', brand: 'Himalaya', pack: '60 Tabs', mrp: 180, price: 162, description: 'Brain tonic tablets for memory, focus and cognitive function.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Diabecon Tablets 60s', brand: 'Himalaya', pack: '60 Tabs', mrp: 160, price: 144, description: 'Herbal anti-diabetic tablets for blood sugar management support.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Evecare Capsules 30s', brand: 'Himalaya', pack: '30 Caps', mrp: 175, price: 157, description: 'Herbal capsules for menstrual cycle regulation and uterine health.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Geriforte Tablets 100s', brand: 'Himalaya', pack: '100 Tabs', mrp: 260, price: 234, description: 'Anti-stress and rejuvenation tablets for overall well-being.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Gasex Tablets 100s', brand: 'Himalaya', pack: '100 Tabs', mrp: 120, price: 108, description: 'Herbal tablets for gas, bloating, flatulence and indigestion.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Pilex Tablets 60s', brand: 'Himalaya', pack: '60 Tabs', mrp: 145, price: 130, description: 'Herbal tablets for hemorrhoids (piles) management.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Speman Tablets 60s', brand: 'Himalaya', pack: '60 Tabs', mrp: 185, price: 166, description: 'Herbal tablets to improve sperm count and male reproductive health.', catSlug: 'caps-tabs' },
  { name: 'Himalaya Bonnisan Liquid 120ml', brand: 'Himalaya', pack: '120ml', mrp: 80, price: 72, description: 'Herbal digestive tonic for infants with dill oil and tinospora.', catSlug: 'liquids' },
  { name: 'Himalaya Koflet Syrup 100ml', brand: 'Himalaya', pack: '100ml', mrp: 95, price: 85, description: 'Herbal cough syrup with honey, tulsi and mulethi for all types of cough.', catSlug: 'liquids' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  VLCC                                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
const VLCC = [
  { name: 'VLCC Ayurveda Facial Kit 5 Session', brand: 'VLCC', pack: '1 Kit', mrp: 250, price: 225, description: 'Complete 5-step facial kit with haldi and chandan for glowing skin.', catSlug: 'fmcg' },
  { name: 'VLCC Gold Facial Kit 60g (6 Step)', brand: 'VLCC', pack: '1 Kit', mrp: 325, price: 292, description: 'Luxury gold facial kit for radiant, youthful party-ready skin.', catSlug: 'fmcg' },
  { name: 'VLCC Insta Glow Gold Bleach 30g', brand: 'VLCC', pack: '30g', mrp: 99, price: 89, description: 'Gold bleach cream for instant fairness and glow. For face and body.', catSlug: 'fmcg' },
  { name: 'VLCC Anti-Tan Skin Lightening Face Wash 150ml', brand: 'VLCC', pack: '150ml', mrp: 260, price: 234, description: 'Face wash with mulberry extract for tan removal and brightening.', catSlug: 'fmcg' },
  { name: 'VLCC Shape Up Slimming Oil 200ml', brand: 'VLCC', pack: '200ml', mrp: 450, price: 405, description: 'Body shaping oil with ginger, capsicum and caffeine for inch-loss.', catSlug: 'fmcg' },
  { name: 'VLCC De-Tan Sunscreen Gel Cream SPF 50 100g', brand: 'VLCC', pack: '100g', mrp: 475, price: 427, description: 'SPF 50 PA+++ sunscreen for de-tan and sun damage protection.', catSlug: 'cream-ointment' },
  { name: 'VLCC Honey Moisturiser 100ml', brand: 'VLCC', pack: '100ml', mrp: 199, price: 179, description: 'Lightweight honey moisturiser for soft, supple and hydrated skin.', catSlug: 'cream-ointment' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PROTINEX / HORLICKS / ENSURE                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */
const NUTRITION = [
  { name: 'Protinex Original 400g', brand: 'Protinex', pack: '400g', mrp: 524, price: 471, description: 'High protein nutritional supplement for adults. 25g protein per serve.', catSlug: 'nutrition' },
  { name: 'Protinex Mama Chocolate 400g', brand: 'Protinex', pack: '400g', mrp: 460, price: 414, description: 'Nutritional drink for pregnant and lactating mothers with DHA and iron.', catSlug: 'nutrition' },
  { name: 'Horlicks Health Drink Classic Malt 500g', brand: 'Horlicks', pack: '500g', mrp: 295, price: 265, description: 'Health and nutrition drink with bio-available nutrients for growth.', catSlug: 'nutrition' },
  { name: 'Horlicks Growth Plus 400g', brand: 'Horlicks', pack: '400g', mrp: 530, price: 477, description: 'Clinically proven growth drink for children 3-9 years.', catSlug: 'nutrition' },
  { name: 'Ensure Complete Nutrition Vanilla 400g', brand: 'Abbott', pack: '400g', mrp: 740, price: 666, description: 'Complete balanced nutrition drink with 32 essential nutrients.', catSlug: 'nutrition' },
  { name: 'PediaSure Health & Nutrition Drink Chocolate 400g', brand: 'Abbott', pack: '400g', mrp: 595, price: 535, description: 'Complete nutrition drink for children 2-10 years with 37 nutrients.', catSlug: 'nutrition' },
  { name: 'Complan Nutrition Drink Royal Chocolate 500g', brand: 'Complan', pack: '500g', mrp: 345, price: 310, description: 'Growth drink with 34 vital nutrients including 100% milk protein.', catSlug: 'nutrition' },
  { name: 'Bournvita Health Drink Chocolate 500g', brand: 'Cadbury', pack: '500g', mrp: 265, price: 238, description: 'Chocolate health drink with vitamins and minerals for active kids.', catSlug: 'nutrition' },
  { name: 'Glucon-D Instant Energy Orange 450g', brand: 'Zydus', pack: '450g', mrp: 175, price: 157, description: 'Instant glucose energy drink with vitamin D for quick energy replenishment.', catSlug: 'nutrition' },
  { name: 'Boost Health Drink 500g', brand: 'GSK', pack: '500g', mrp: 285, price: 256, description: 'Malt-based nutrition drink with stamina-boosting nutrients for active children.', catSlug: 'nutrition' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  WHISPER / STAYFREE (Feminine Hygiene)                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
const FEMININE = [
  { name: 'Whisper Ultra Clean Wings XL (30 Pads)', brand: 'Whisper', pack: '30 Pads', mrp: 356, price: 320, description: 'Ultra-thin sanitary pads with dry top cover and odour lock for 40% better protection.', catSlug: 'fmcg' },
  { name: 'Whisper Choice Wings Regular (20 Pads)', brand: 'Whisper', pack: '20 Pads', mrp: 145, price: 130, description: 'Affordable sanitary pads with wings for comfortable everyday protection.', catSlug: 'fmcg' },
  { name: 'Whisper Ultra Nights XL+ (15 Pads)', brand: 'Whisper', pack: '15 Pads', mrp: 220, price: 198, description: 'Extra-long night pads with 3x wider back for all-night leakage protection.', catSlug: 'fmcg' },
  { name: 'Stayfree Secure Cottony Soft XL (20 Pads)', brand: 'Stayfree', pack: '20 Pads', mrp: 165, price: 148, description: 'Cottony soft cover pads with DryMax core for up to 12-hour protection.', catSlug: 'fmcg' },
  { name: 'Stayfree Secure Dry XL (20 Pads)', brand: 'Stayfree', pack: '20 Pads', mrp: 145, price: 130, description: 'Dry cover sanitary pads with odour control for comfortable protection.', catSlug: 'fmcg' },
  { name: 'Stayfree All Night XL (7 Pads)', brand: 'Stayfree', pack: '7 Pads', mrp: 99, price: 89, description: 'Extra-long overnight pads for heavy flow nights.', catSlug: 'fmcg' },
  { name: 'Whisper Ultra Soft XL+ (50 Pads)', brand: 'Whisper', pack: '50 Pads', mrp: 595, price: 535, description: 'Mega value pack ultra-soft sanitary pads for daily comfort.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ORAL-B / PHILIPS (Dental devices)                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */
const DENTAL = [
  { name: 'Oral-B Sensitive Toothbrush (Pack of 4)', brand: 'Oral-B', pack: '4 pcs', mrp: 182, price: 163, description: 'Soft bristle toothbrush with extra soft cup-shaped bristles.', catSlug: 'fmcg' },
  { name: 'Oral-B Criss Cross Toothbrush Medium (Pack of 4)', brand: 'Oral-B', pack: '4 pcs', mrp: 178, price: 160, description: 'CrissCross bristles for up to 90% plaque removal along gum line.', catSlug: 'fmcg' },
  { name: 'Oral-B Pro-Health Clinical Protection Toothpaste 70g', brand: 'Oral-B', pack: '70g', mrp: 165, price: 148, description: 'Dentist-inspired toothpaste for gum health and enamel protection.', catSlug: 'fmcg' },
  { name: 'Oral-B Essential Floss 50m', brand: 'Oral-B', pack: '50m', mrp: 120, price: 108, description: 'Waxed dental floss with shred-resistant texture for effective flossing.', catSlug: 'fmcg' },
  { name: 'Listerine Cool Mint Mouthwash 250ml', brand: 'Listerine', pack: '250ml', mrp: 140, price: 126, description: 'Antiseptic mouthwash that kills 99.9% germs causing bad breath.', catSlug: 'fmcg' },
  { name: 'Listerine Total Care Mouthwash 500ml', brand: 'Listerine', pack: '500ml', mrp: 350, price: 315, description: '6-in-1 benefits: cavity protection, fresh breath, healthy gums, enamel strength.', catSlug: 'fmcg' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MASTER LIST                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */
const ALL_BRANDS = [
  { label: 'Nivea',              data: NIVEA },
  { label: 'Neutrogena',         data: NEUTROGENA },
  { label: 'Biotique',           data: BIOTIQUE },
  { label: 'BoroPlus',           data: BOROPLUS },
  { label: 'Volini',             data: VOLINI },
  { label: 'Vicks',              data: VICKS },
  { label: 'Colgate',            data: COLGATE },
  { label: 'Sensodyne',          data: SENSODYNE },
  { label: 'Moov',               data: MOOV },
  { label: 'Zandu',              data: ZANDU },
  { label: 'Baidyanath',         data: BAIDYANATH },
  { label: 'Hamdard',            data: HAMDARD },
  { label: 'Cipla Health',       data: CIPLA },
  { label: 'Dr. Morepen',        data: MOREPEN },
  { label: 'Emami',              data: EMAMI },
  { label: 'Vaseline',           data: VASELINE },
  { label: 'Dove',               data: DOVE },
  { label: 'Lifebuoy',           data: LIFEBUOY },
  { label: 'Savlon',             data: SAVLON },
  { label: 'Betadine',           data: BETADINE },
  { label: 'Johnson & Johnson',  data: JNJ },
  { label: 'Garnier',            data: GARNIER },
  { label: 'Pepsodent',          data: PEPSODENT },
  { label: 'Sunsilk / Clinic Plus', data: HAIRCARE_BRANDS },
  { label: 'Santoor / Yardley',  data: SANTOOR_YARDLEY },
  { label: 'Pharma OTC',         data: PHARMA_OTC },
  { label: 'Lotus Herbals',      data: LOTUS },
  { label: 'Himalaya Wellness',  data: HIMALAYA_WELLNESS },
  { label: 'VLCC',               data: VLCC },
  { label: 'Nutrition Drinks',   data: NUTRITION },
  { label: 'Feminine Hygiene',   data: FEMININE },
  { label: 'Dental Care',        data: DENTAL },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN                                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
async function main() {
  const totalProducts = ALL_BRANDS.reduce((s, b) => s + b.data.length, 0);
  console.log(`Seeding ${ALL_BRANDS.length} brand groups (${totalProducts} products)...\n`);

  // Ensure needed categories exist
  const catCache = {};
  const catNames = {
    fmcg: 'FMCG',
    'cream-ointment': 'Cream & Ointment',
    lotion: 'Lotion',
    liquids: 'Liquids',
    'caps-tabs': 'Caps & Tabs',
    powder: 'Powder',
    ayurvedic: 'Ayurvedic',
    'pharma-misc': 'Pharma Misc',
    'softgel-capsules': 'Softgel Capsules',
    nutrition: 'Nutrition',
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
        await insertProduct(p, catCache[p.catSlug]);
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
