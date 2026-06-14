/**
 * Quick SMTP test — run from project root:
 *   node test-email.js
 */
require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });

const nodemailer = require('./backend/node_modules/nodemailer');

const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM } = process.env;

console.log('\n=== Email Config ===');
console.log('HOST :', MAIL_HOST);
console.log('PORT :', MAIL_PORT);
console.log('USER :', MAIL_USER);
console.log('FROM :', MAIL_FROM);
console.log('PASS :', MAIL_PASS ? '***set***' : '❌ NOT SET');
console.log('====================\n');

if (!MAIL_HOST || !MAIL_USER || !MAIL_PASS) {
  console.error('❌ SMTP config missing in .env! Check MAIL_HOST / MAIL_USER / MAIL_PASS');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host:   MAIL_HOST.trim(),
  port:   parseInt(MAIL_PORT) || 465,
  secure: parseInt(MAIL_PORT) === 465,
  auth:   { user: MAIL_USER.trim(), pass: MAIL_PASS.trim() },
  tls:    { rejectUnauthorized: false },
  connectionTimeout: 15000,
});

(async () => {
  try {
    console.log('⏳ Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection OK!\n');

    console.log('⏳ Sending test email...');
    const info = await transporter.sendMail({
      from:    MAIL_FROM || MAIL_USER,
      to:      MAIL_USER,          // sends to itself
      subject: 'Health Hub — SMTP Test',
      html:    '<h2>✅ Email is working!</h2><p>Health Hub SMTP is configured correctly on healthub.site</p>',
    });

    console.log('✅ Email sent!');
    console.log('   Message ID:', info.messageId);
    console.log('   Check inbox at: https://healthub.site:2096\n');
  } catch (err) {
    console.error('❌ SMTP Error:', err.message);
    if (err.code === 'EAUTH') {
      console.error('   → Wrong email password. Check MAIL_PASS in backend/.env');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('   → Cannot connect to mail server. Check MAIL_HOST / MAIL_PORT');
    }
  }
})();
