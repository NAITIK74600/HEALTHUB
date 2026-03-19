'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    charset: 'utf8mb4',
  });

  try {
    console.log('Checking prescriptions table for address_json column...');
    const [columns] = await conn.query('SHOW COLUMNS FROM prescriptions LIKE "address_json"');
    
    if (columns.length === 0) {
      console.log('Adding address_json column...');
      await conn.query('ALTER TABLE prescriptions ADD COLUMN address_json JSON NULL AFTER notes');
      console.log('Column added successfully.');
    } else {
      console.log('Column address_json already exists.');
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await conn.end();
  }
}

run();
