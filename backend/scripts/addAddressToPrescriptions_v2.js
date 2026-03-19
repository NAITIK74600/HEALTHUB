'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, execute, getPool } = require('../db/mysql');

console.log('CWD:', process.cwd());
console.log('DB Host:', process.env.MYSQL_HOST);
console.log('DB User:', process.env.MYSQL_USER);
console.log('DB Pass length:', (process.env.MYSQL_PASSWORD || '').length);

async function run() {
  try {
    console.log('Checking prescriptions table for address_json column...');
    // We need to query information_schema or just execute ALTER and catch
    // But let's use query() as exported by db/mysql.js
    // Note: query() returns rows directly in this project's wrapper
    const rows = await query('SHOW COLUMNS FROM prescriptions LIKE "address_json"');
    
    if (rows.length === 0) {
      console.log('Adding address_json column...');
      await execute('ALTER TABLE prescriptions ADD COLUMN address_json JSON NULL AFTER notes');
      console.log('Column added successfully.');
    } else {
      console.log('Column address_json already exists.');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    const pool = getPool();
    if (pool) await pool.end();
  }
}

run();
