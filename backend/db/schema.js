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

  await ensureSuperAdmin();
  initialized = true;
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