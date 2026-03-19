const express = require('express');
const crypto = require('crypto');
const { body, query: queryValidator, param, validationResult } = require('express-validator');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { query, execute } = require('../db/mysql');

const router = express.Router();

function mapOrder(row, items = []) {
  return {
    _id: String(row.id),
    user: row.user_id ? { _id: String(row.user_id), name: row.user_name || '', email: row.user_email || '', phone: row.user_phone || '' } : null,
    items: items.map(i => ({
      _id: String(i.id),
      product: i.product_id ? String(i.product_id) : null,
      name: i.name,
      price: Number(i.price),
      qty: Number(i.qty),
    })),
    total: Number(row.total || 0),
    discount: Number(row.discount || 0),
    deliveryCharge: Number(row.delivery_charge || 0),
    couponCode: row.coupon_code || '',
    status: row.status || 'placed',
    paymentStatus: row.payment_status || 'pending',
    address: (() => { try { return typeof row.address_json === 'string' ? JSON.parse(row.address_json) : (row.address_json || null); } catch { return null; } })(),
    prescriptionUrl: row.prescription_url || '',
    notes: row.notes || '',
    razorpayOrderId: row.razorpay_order_id || '',
    deliveryOtp: row.delivery_otp || '',
    deliveryBoyId: row.delivery_boy_id ? String(row.delivery_boy_id) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// POST /api/orders — create order (COD for now, Razorpay can be added later)
router.post('/', requireAuth, [
  body('items').isArray({ min: 1 }),
  body('address').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { items, address, couponCode, discount, deliveryCharge, prescriptionUrl, notes, paymentMethod } = req.body;

    let total = 0;
    const orderItems = [];
    for (const item of items) {
      const price = Number(item.price || 0);
      const qty = Number(item.qty || 1);
      total += price * qty;
      orderItems.push({
        product_id: item.productId || item.product || null,
        name: String(item.name || '').slice(0, 200),
        price,
        qty,
      });
    }

    total = total - Number(discount || 0) + Number(deliveryCharge || 0);
    if (total < 0) total = 0;

    const otp = String(Math.floor(1000 + Math.random() * 9000));

    const result = await execute(
      `INSERT INTO orders (user_id, total, status, payment_status, address_json, coupon_code, discount,
       delivery_charge, notes, prescription_url, delivery_otp)
       VALUES (?, ?, 'placed', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        total,
        paymentMethod === 'online' ? 'pending' : 'cod',
        JSON.stringify(address),
        couponCode || null,
        Number(discount || 0),
        Number(deliveryCharge || 0),
        notes || null,
        prescriptionUrl || null,
        otp,
      ]
    );

    const orderId = result.insertId;

    // Insert items
    for (const item of orderItems) {
      await execute(
        'INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.name, item.price, item.qty]
      );
    }

    // If online payment requested, create Razorpay order
    if (paymentMethod === 'online' && process.env.RAZORPAY_KEY_ID) {
      try {
        const Razorpay = require('razorpay');
        const rzp = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        const rzpOrder = await rzp.orders.create({
          amount: Math.round(total * 100),
          currency: 'INR',
          receipt: `order_${orderId}`,
        });
        await execute('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [rzpOrder.id, orderId]);
        const rows = await query(
          `SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
           FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
          [orderId]
        );
        const orderItemRows = await query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
        return res.status(201).json({
          order: mapOrder(rows[0], orderItemRows),
          razorpayOrderId: rzpOrder.id,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID,
          amount: Math.round(total * 100),
        });
      } catch (rzpErr) {
        console.error('Razorpay order creation failed:', rzpErr.message);
        // Fall through to COD
      }
    }

    const rows = await query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
       FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
      [orderId]
    );
    const orderItemRows = await query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    res.status(201).json({ order: mapOrder(rows[0], orderItemRows) });
  } catch (err) { next(err); }
});

// POST /api/orders/verify-payment
router.post('/verify-payment', requireAuth, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const generated = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed.' });
    }

    await execute(
      `UPDATE orders SET payment_status = 'paid', razorpay_payment_id = ? WHERE razorpay_order_id = ?`,
      [razorpay_payment_id, razorpay_order_id]
    );
    res.json({ message: 'Payment verified.' });
  } catch (err) { next(err); }
});

// GET /api/orders/my — customer's orders
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
       FROM orders o LEFT JOIN users u ON u.id = o.user_id
       WHERE o.user_id = ? AND o.is_deleted = 0 ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    const orders = [];
    for (const row of rows) {
      const items = await query('SELECT * FROM order_items WHERE order_id = ?', [row.id]);
      orders.push(mapOrder(row, items));
    }
    res.json({ orders });
  } catch (err) { next(err); }
});

// GET /api/orders/:id — single order
router.get('/:id', requireAuth, [param('id').isInt({ min: 1 })], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const rows = await query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
       FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ? AND o.is_deleted = 0`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found.' });

    // Customers can only see their own orders
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const items = await query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json(mapOrder(rows[0], items));
  } catch (err) { next(err); }
});

// GET /api/orders — admin: all orders
router.get('/', requireAuth, requireAdmin, [
  queryValidator('page').optional().isInt({ min: 1 }).toInt(),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  queryValidator('status').optional().trim(),
], async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let whereSql = 'WHERE o.is_deleted = 0';
    const vals = [];
    if (status) { whereSql += ' AND o.status = ?'; vals.push(status); }

    const [rows, countRows] = await Promise.all([
      query(
        `SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
         FROM orders o LEFT JOIN users u ON u.id = o.user_id
         ${whereSql} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
        [...vals, limit, offset]
      ),
      query(`SELECT COUNT(*) AS total FROM orders o ${whereSql}`, vals),
    ]);

    const total = Number(countRows[0]?.total || 0);
    const orders = [];
    for (const row of rows) {
      const items = await query('SELECT * FROM order_items WHERE order_id = ?', [row.id]);
      orders.push(mapOrder(row, items));
    }
    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// PATCH /api/orders/:id/status — admin update status
router.patch('/:id/status', requireAuth, requireAdmin, [param('id').isInt({ min: 1 })], async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(422).json({ message: 'Status required.' });
    await execute('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Status updated.' });
  } catch (err) { next(err); }
});

// POST /api/orders/:id/verify-otp
router.post('/:id/verify-otp', requireAuth, [param('id').isInt({ min: 1 })], async (req, res, next) => {
  try {
    const { otp } = req.body;
    const rows = await query('SELECT delivery_otp FROM orders WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Order not found.' });
    if (rows[0].delivery_otp !== otp) return res.status(400).json({ message: 'Invalid OTP.' });
    await execute("UPDATE orders SET status = 'delivered' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Order delivered.' });
  } catch (err) { next(err); }
});

// POST /api/orders/:id/regenerate-otp
router.post('/:id/regenerate-otp', requireAuth, requireAdmin, [param('id').isInt({ min: 1 })], async (req, res, next) => {
  try {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    await execute('UPDATE orders SET delivery_otp = ? WHERE id = ?', [otp, req.params.id]);
    res.json({ otp });
  } catch (err) { next(err); }
});

// POST /api/orders/:id/reorder
router.post('/:id/reorder', requireAuth, [param('id').isInt({ min: 1 })], async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Order not found.' });
    const items = await query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ items: items.map(i => ({ productId: i.product_id, name: i.name, price: Number(i.price), qty: Number(i.qty) })) });
  } catch (err) { next(err); }
});

// Webhook placeholder — raw body already parsed in server.js
router.post('/webhook', (req, res) => {
  // TODO: Implement Razorpay webhook handling
  res.json({ status: 'ok' });
});

module.exports = router;
