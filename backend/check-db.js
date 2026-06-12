'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDB() {
  console.log('\n=== cPanel MySQL Connection Check ===');
  console.log(`  Host     : ${process.env.MYSQL_HOST}`);
  console.log(`  Port     : ${process.env.MYSQL_PORT || 3306}`);
  console.log(`  User     : ${process.env.MYSQL_USER}`);
  console.log(`  Database : ${process.env.MYSQL_DATABASE}`);
  console.log('=====================================\n');

  let connection;
  try {
    connection = await mysql.createConnection({
      host     : process.env.MYSQL_HOST || 'localhost',
      port     : Number(process.env.MYSQL_PORT || 3306),
      user     : process.env.MYSQL_USER,
      password : process.env.MYSQL_PASSWORD,
      database : process.env.MYSQL_DATABASE,
    });

    // 1. Basic ping
    await connection.ping();
    console.log('[OK] Connected to MySQL server.');

    // 2. Server version
    const [[{ version }]] = await connection.query('SELECT VERSION() AS version');
    console.log(`[OK] MySQL version : ${version}`);

    // 3. List tables
    const [tables] = await connection.query('SHOW TABLES');
    const key = Object.keys(tables[0] || {})[0];
    const tableNames = tables.map(r => r[key]);
    console.log(`[OK] Tables found  : ${tableNames.length}`);
    if (tableNames.length) {
      tableNames.forEach(t => console.log(`       - ${t}`));
    }

    console.log('\n Connection is HEALTHY.\n');
  } catch (err) {
    console.error('\n[FAIL] Connection failed:');
    console.error(`  Code    : ${err.code}`);
    console.error(`  Message : ${err.message}`);
    console.error('\n Possible fixes:');
    console.error('  1. Verify MYSQL_USER / MYSQL_PASSWORD in .env');
    console.error('  2. Make sure the cPanel DB user is granted privileges to the database');
    console.error('  3. If running remotely, enable Remote MySQL in cPanel and whitelist your IP');
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

checkDB();
