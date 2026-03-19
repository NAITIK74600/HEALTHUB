const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost', user: 'root', password: '', database: 'batlamed_store'
    });
    console.log('Connected as root!');
    await conn.end();
  } catch(e) { console.log('root failed:', e.message); }
})();
