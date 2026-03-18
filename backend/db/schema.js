'use strict';

const bcrypt = require('bcryptjs');
const { execute, query } = require('./mysql');
const { findUserByEmail, createUser, updateUser } = require('./users');

let initialized = false;

async function ensureCoreSchema() {
  if (initialized) return;

  await execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(150) NOT NULL,
      slug VARCHAR(160) NOT NULL,
      icon VARCHAR(255) NULL,
      ord INT NOT NULL DEFAULT 0,
      is_deleted TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_categories_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS products (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      code VARCHAR(50) NOT NULL DEFAULT '',
      name VARCHAR(200) NOT NULL,
      slug VARCHAR(220) NOT NULL,
      category_id BIGINT UNSIGNED NOT NULL,
      brand VARCHAR(100) NOT NULL DEFAULT '',
      description TEXT NULL,
      pack VARCHAR(100) NOT NULL DEFAULT '',
      mrp DECIMAL(12,2) NOT NULL DEFAULT 0,
      price DECIMAL(12,2) NOT NULL DEFAULT 0,
      stock INT NOT NULL DEFAULT 0,
      requires_prescription TINYINT(1) NOT NULL DEFAULT 0,
      images_json JSON NULL,
      expiry_date DATETIME NULL,
      batch_number VARCHAR(50) NOT NULL DEFAULT '',
      salt VARCHAR(500) NOT NULL DEFAULT '',
      side_effects VARCHAR(1000) NOT NULL DEFAULT '',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      is_deleted TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_products_slug (slug),
      KEY idx_products_category (category_id),
      KEY idx_products_active_deleted (is_active, is_deleted),
      FULLTEXT KEY ftx_products_search (name, brand, description),
      CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(190) NOT NULL,
      phone VARCHAR(20) NOT NULL DEFAULT '',
      password_hash VARCHAR(255) NULL,
      role ENUM('customer', 'admin', 'superadmin') NOT NULL DEFAULT 'customer',
      auth_provider ENUM('local', 'google') NOT NULL DEFAULT 'local',
      google_id VARCHAR(191) NULL,
      addresses_json JSON NULL,
      family_members_json JSON NULL,
      is_banned TINYINT(1) NOT NULL DEFAULT 0,
      email_verified TINYINT(1) NOT NULL DEFAULT 0,
      email_verify_token VARCHAR(191) NULL,
      email_verify_expiry DATETIME NULL,
      email_otp VARCHAR(191) NULL,
      email_otp_expiry DATETIME NULL,
      reset_otp VARCHAR(191) NULL,
      reset_otp_expiry DATETIME NULL,
      failed_login_attempts INT NOT NULL DEFAULT 0,
      lock_until DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_users_email (email),
      UNIQUE KEY uq_users_google_id (google_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      token VARCHAR(191) NOT NULL,
      expires_at DATETIME NOT NULL,
      used TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_refresh_tokens_token (token),
      KEY idx_refresh_tokens_user (user_id),
      CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      actor_id BIGINT UNSIGNED NULL,
      actor_email VARCHAR(190) NOT NULL DEFAULT '',
      action VARCHAR(100) NOT NULL,
      target_model VARCHAR(100) NOT NULL,
      target_id VARCHAR(191) NULL,
      before_json JSON NULL,
      after_json JSON NULL,
      ip VARCHAR(100) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_audit_logs_actor (actor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NULL,
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'placed',
      payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      is_deleted TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_orders_created (created_at),
      KEY idx_orders_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS brands (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(150) NOT NULL,
      slug VARCHAR(160) NOT NULL,
      logo_url VARCHAR(500) NULL,
      category ENUM('featured', 'ayurvedic', 'general') NOT NULL DEFAULT 'general',
      ord INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_brands_slug (slug),
      KEY idx_brands_category_active (category, is_active, ord)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS availability_requests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      medicine_name VARCHAR(180) NOT NULL,
      customer_name VARCHAR(120) NOT NULL DEFAULT '',
      phone VARCHAR(25) NOT NULL DEFAULT '',
      email VARCHAR(190) NOT NULL DEFAULT '',
      search_query VARCHAR(200) NOT NULL DEFAULT '',
      status ENUM('pending', 'reviewed', 'fulfilled', 'rejected') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_availability_requests_status_created (status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS coupons (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      code VARCHAR(50) NOT NULL,
      discount_type ENUM('percent', 'flat') NOT NULL DEFAULT 'percent',
      discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
      min_order_value DECIMAL(10,2) NOT NULL DEFAULT 0,
      max_discount DECIMAL(10,2) NULL,
      max_uses INT NULL,
      uses_count INT NOT NULL DEFAULT 0,
      expires_at DATETIME NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_coupons_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS delivery_boys (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      name VARCHAR(100) NOT NULL DEFAULT '',
      phone VARCHAR(20) NOT NULL DEFAULT '',
      email VARCHAR(190) NOT NULL DEFAULT '',
      status ENUM('pending','active','suspended') NOT NULL DEFAULT 'pending',
      is_available TINYINT(1) NOT NULL DEFAULT 0,
      lat DECIMAL(10,8) NULL,
      lng DECIMAL(11,8) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_delivery_boys_user (user_id),
      CONSTRAINT fk_delivery_boys_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS lab_tests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(200) NOT NULL,
      slug VARCHAR(210) NOT NULL,
      category ENUM('blood','urine','stool','imaging','cardiac','hormones','vitamins','other') NOT NULL DEFAULT 'other',
      description TEXT NULL,
      sample_type VARCHAR(100) NOT NULL DEFAULT 'Blood',
      turnaround_time VARCHAR(50) NOT NULL DEFAULT '24 hrs',
      parameters_json JSON NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      home_collection TINYINT(1) NOT NULL DEFAULT 1,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_lab_tests_slug (slug),
      KEY idx_lab_tests_category_active (category, is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS lab_bookings (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      test_ids_json JSON NOT NULL,
      test_snapshots_json JSON NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      patient_name VARCHAR(100) NOT NULL,
      patient_age INT NULL,
      patient_gender ENUM('male','female','other') NOT NULL DEFAULT 'male',
      phone VARCHAR(20) NOT NULL,
      collection_type ENUM('home','walkin') NOT NULL DEFAULT 'home',
      address_json JSON NULL,
      booking_date DATE NOT NULL,
      slot VARCHAR(50) NOT NULL,
      status ENUM('pending','confirmed','sample_collected','processing','report_ready','completed','cancelled') NOT NULL DEFAULT 'pending',
      report_url VARCHAR(500) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_lab_bookings_user (user_id),
      KEY idx_lab_bookings_status (status),
      KEY idx_lab_bookings_date (booking_date),
      CONSTRAINT fk_lab_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await seedDefaultLabTests();
  await ensureSuperAdmin();
  initialized = true;
}

async function seedDefaultLabTests() {
  const [[{ cnt }]] = await query('SELECT COUNT(*) AS cnt FROM lab_tests', []);
  if (Number(cnt) > 0) return; // already seeded

  const tests = [
    { name: 'Complete Blood Count (CBC)', slug: 'complete-blood-count-cbc', category: 'blood',    description: 'Measures all blood cell components including RBC, WBC and platelets.', sample_type: 'Blood',  turnaround_time: '24 hrs',  parameters_json: JSON.stringify(['RBC','WBC','Haemoglobin','Platelets','Haematocrit']), price: 249,  home_collection: 1 },
    { name: 'Blood Sugar Fasting',        slug: 'blood-sugar-fasting',        category: 'blood',    description: 'Measures glucose level after 8–12 hours of fasting.',                   sample_type: 'Blood',  turnaround_time: '24 hrs',  parameters_json: JSON.stringify(['Fasting Glucose']),                                  price: 99,   home_collection: 1 },
    { name: 'HbA1c (Diabetes Panel)',     slug: 'hba1c-diabetes-panel',       category: 'blood',    description: 'Reflects average blood sugar over the past 2–3 months.',               sample_type: 'Blood',  turnaround_time: '24 hrs',  parameters_json: JSON.stringify(['HbA1c','Fasting Glucose']),                          price: 349,  home_collection: 1 },
    { name: 'Thyroid Profile (T3,T4,TSH)',slug: 'thyroid-profile-t3-t4-tsh',  category: 'hormones', description: 'Evaluates thyroid gland function.',                                     sample_type: 'Blood',  turnaround_time: '48 hrs',  parameters_json: JSON.stringify(['T3','T4','TSH']),                                    price: 499,  home_collection: 1 },
    { name: 'Lipid Profile',              slug: 'lipid-profile',              category: 'cardiac',  description: 'Measures cholesterol, HDL, LDL and triglycerides.',                    sample_type: 'Blood',  turnaround_time: '24 hrs',  parameters_json: JSON.stringify(['Total Cholesterol','HDL','LDL','Triglycerides']),   price: 399,  home_collection: 1 },
    { name: 'Kidney Function Test (KFT)', slug: 'kidney-function-test-kft',   category: 'blood',    description: 'Assesses kidney health via creatinine, urea and uric acid.',            sample_type: 'Blood',  turnaround_time: '24 hrs',  parameters_json: JSON.stringify(['Creatinine','Urea','Uric Acid','eGFR']),             price: 449,  home_collection: 1 },
    { name: 'Liver Function Test (LFT)',  slug: 'liver-function-test-lft',    category: 'blood',    description: 'Checks liver enzymes, bilirubin and protein levels.',                  sample_type: 'Blood',  turnaround_time: '24 hrs',  parameters_json: JSON.stringify(['SGOT','SGPT','Bilirubin','ALT','AST']),              price: 449,  home_collection: 1 },
    { name: 'Vitamin D (25-OH)',          slug: 'vitamin-d-25-oh',            category: 'vitamins', description: 'Checks vitamin D deficiency, common in India.',                        sample_type: 'Blood',  turnaround_time: '48 hrs',  parameters_json: JSON.stringify(['25-OH Vitamin D']),                                  price: 649,  home_collection: 1 },
    { name: 'Vitamin B12',               slug: 'vitamin-b12',                category: 'vitamins', description: 'Measures B12 level; deficiency causes fatigue & nerve issues.',        sample_type: 'Blood',  turnaround_time: '48 hrs',  parameters_json: JSON.stringify(['Vitamin B12']),                                      price: 449,  home_collection: 1 },
    { name: 'Full Body Checkup',          slug: 'full-body-checkup',          category: 'blood',    description: 'Comprehensive health screen covering 72+ parameters.',                  sample_type: 'Blood',  turnaround_time: '48 hrs',  parameters_json: JSON.stringify(['CBC','LFT','KFT','Lipid Profile','Thyroid','HbA1c','Vitamin D','Vitamin B12']), price: 1499, home_collection: 1 },
    { name: 'Urine Routine & Microscopy', slug: 'urine-routine-microscopy',   category: 'urine',    description: 'Screens for infection, diabetes, kidney disease via urine analysis.',   sample_type: 'Urine', turnaround_time: '24 hrs',  parameters_json: JSON.stringify(['Protein','Glucose','Pus Cells','RBC']),              price: 149,  home_collection: 1 },
    { name: 'Dengue NS1 Antigen',         slug: 'dengue-ns1-antigen',         category: 'blood',    description: 'Early detection of dengue fever infection.',                            sample_type: 'Blood',  turnaround_time: '24 hrs',  parameters_json: JSON.stringify(['NS1 Antigen']),                                      price: 499,  home_collection: 1 },
  ];

  for (const t of tests) {
    try {
      await execute(
        `INSERT IGNORE INTO lab_tests (name, slug, category, description, sample_type, turnaround_time, parameters_json, price, home_collection)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.name, t.slug, t.category, t.description, t.sample_type, t.turnaround_time, t.parameters_json, t.price, t.home_collection]
      );
    } catch (_) { /* skip duplicates */ }
  }
}

async function ensureSuperAdmin() {
  const email = String(process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.SUPERADMIN_PASSWORD || '').trim();
  if (!email || !password) return;

  const existing = await findUserByEmail(email);
  const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 12);

  if (!existing) {
    await createUser({
      name: 'Super Admin',
      email,
      phone: '',
      passwordHash,
      role: 'superadmin',
      authProvider: 'local',
      emailVerified: true,
      addresses: [],
      familyMembers: [],
      isBanned: false,
    });
    return;
  }

  if (existing.role !== 'superadmin' || !existing.emailVerified) {
    existing.role = 'superadmin';
    existing.emailVerified = true;
    existing.passwordHash = passwordHash;
    existing.authProvider = 'local';
    await updateUser(existing);
  }
}

async function getCoreCounts() {
  const [users] = await query('SELECT COUNT(*) AS total FROM users', []);
  return { users: Number(users?.total || 0) };
}

module.exports = { ensureCoreSchema, ensureSuperAdmin, getCoreCounts };