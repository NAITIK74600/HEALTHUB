const express = require('express');
const { param, body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { query, execute } = require('../db/mysql');
const {
  findUserById,
  findUserByEmail,
  createUser,
  updateUser,
  deleteUserById,
  listUsers,
  countUsers,
} = require('../db/users');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

let syncStatus = { running: false, done: false, matched: 0, updated: 0, skipped: 0, error: null, startedAt: null, finishedAt: null };

function mapAuditLog(row) {
  return {
    _id: String(row.id),
    actorId: row.actor_id ? String(row.actor_id) : null,
    actorEmail: row.actor_email,
    action: row.action,
    targetModel: row.target_model,
    targetId: row.target_id,
    before: row.before_json ? JSON.parse(row.before_json) : null,
    after: row.after_json ? JSON.parse(row.after_json) : null,
    ip: row.ip,
    createdAt: row.created_at,
  };
}

router.get('/dashboard', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrdersRow,
      todayOrdersRow,
      pendingOrdersRow,
      totalRevenueRow,
      todayRevenueRow,
      lowStockRows,
      outOfStockRow,
      totalCustomersRow,
    ] = await Promise.all([
      query('SELECT COUNT(*) AS total FROM orders WHERE is_deleted = 0', []),
      query('SELECT COUNT(*) AS total FROM orders WHERE is_deleted = 0 AND created_at >= ?', [today]),
      query("SELECT COUNT(*) AS total FROM orders WHERE is_deleted = 0 AND status = 'placed'", []),
      query("SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE is_deleted = 0 AND payment_status = 'paid'", []),
      query("SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE is_deleted = 0 AND payment_status = 'paid' AND created_at >= ?", [today]),
      query(
        `SELECT p.id, p.name, p.price, p.stock, c.id AS category_id, c.name AS category_name, c.slug AS category_slug
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.is_deleted = 0 AND p.is_active = 1 AND p.stock > 0 AND p.stock <= 5
         ORDER BY p.stock ASC, p.name ASC LIMIT 20`,
        []
      ),
      query('SELECT COUNT(*) AS total FROM products WHERE is_deleted = 0 AND is_active = 1 AND stock = 0', []),
      query("SELECT COUNT(*) AS total FROM users WHERE role = 'customer'", []),
    ]);

    res.json({
      totalOrders: Number(totalOrdersRow[0]?.total || 0),
      todayOrders: Number(todayOrdersRow[0]?.total || 0),
      pendingOrders: Number(pendingOrdersRow[0]?.total || 0),
      totalRevenue: Number(totalRevenueRow[0]?.total || 0),
      todayRevenue: Number(todayRevenueRow[0]?.total || 0),
      lowStock: lowStockRows.map((row) => ({
        _id: String(row.id),
        name: row.name,
        price: Number(row.price || 0),
        stock: Number(row.stock || 0),
        category: row.category_id ? { _id: String(row.category_id), name: row.category_name, slug: row.category_slug } : null,
      })),
      outOfStock: Number(outOfStockRow[0]?.total || 0),
      totalCustomers: Number(totalCustomersRow[0]?.total || 0),
    });
  } catch (err) { next(err); }
});

router.get('/users', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = String(req.query.search || '').trim();
    const [users, total] = await Promise.all([
      listUsers({ roles: ['customer'], search, limit, offset: (page - 1) * limit }),
      countUsers({ roles: ['customer'], search }),
    ]);
    res.json({ users: users.map((user) => user.toSafeObject()), total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) { next(err); }
});

router.patch('/users/:id/ban', requireAuth, requireAdmin,
  [param('id').isInt({ min: 1 }), body('isBanned').isBoolean().toBoolean()],
  auditLogger('BAN_USER', 'User'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const user = await findUserById(req.params.id);
      if (!user || user.role !== 'customer') return res.status(404).json({ message: 'Customer not found.' });
      req._auditBefore = { isBanned: user.isBanned };
      user.isBanned = Boolean(req.body.isBanned);
      await updateUser(user);
      res.json({ message: `User ${user.isBanned ? 'banned' : 'unbanned'}.` });
    } catch (err) { next(err); }
  }
);

router.patch('/users/:id/role', requireAuth, requireSuperAdmin,
  [
    param('id').isInt({ min: 1 }),
    body('role').isIn(['customer', 'admin', 'superadmin']).withMessage('Invalid role.'),
  ],
  auditLogger('CHANGE_ROLE', 'User'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ message: errors.array()[0].msg });
      if (String(req.params.id) === String(req.user._id)) {
        return res.status(400).json({ message: 'Cannot change your own role.' });
      }

      const user = await findUserById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found.' });

      req._auditBefore = { role: user.role };
      user.role = req.body.role;
      if (req.body.role !== 'customer') user.emailVerified = true;
      const saved = await updateUser(user);
      res.json({ message: `Role changed to ${req.body.role}.`, user: saved.toSafeObject() });
    } catch (err) { next(err); }
  }
);

router.get('/admins', requireAuth, requireSuperAdmin, async (req, res, next) => {
  try {
    const admins = await listUsers({ roles: ['admin', 'superadmin'], limit: 500, offset: 0 });
    res.json({ admins: admins.map((user) => user.toSafeObject()) });
  } catch (err) { next(err); }
});

router.post('/admins', requireAuth, requireSuperAdmin, [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('phone').matches(/^\d{10}$/).withMessage('10-digit phone required.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.'),
  body('role').isIn(['admin', 'superadmin']).withMessage('Role must be admin or superadmin.'),
], auditLogger('CREATE_ADMIN', 'User'), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ message: errors.array()[0].msg, errors: errors.array() });

    const existing = await findUserByEmail(req.body.email);
    if (existing) return res.status(409).json({ message: 'Email already registered.' });

    const passwordHash = await bcrypt.hash(req.body.password, Number(process.env.BCRYPT_ROUNDS) || 12);
    const admin = await createUser({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      passwordHash,
      role: req.body.role,
      authProvider: 'local',
      emailVerified: true,
      addresses: [],
      familyMembers: [],
      isBanned: false,
    });
    res.status(201).json(admin.toSafeObject());
  } catch (err) { next(err); }
});

router.delete('/admins/:id', requireAuth, requireSuperAdmin,
  [param('id').isInt({ min: 1 })],
  auditLogger('DELETE_ADMIN', 'User'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
      if (String(req.params.id) === String(req.user._id)) {
        return res.status(400).json({ message: 'Cannot delete your own account.' });
      }

      const admin = await findUserById(req.params.id);
      if (!admin || !['admin', 'superadmin'].includes(admin.role)) {
        return res.status(404).json({ message: 'Admin not found.' });
      }

      req._auditBefore = admin.toSafeObject();
      await deleteUserById(admin._id);
      res.json({ message: 'Admin account deleted.' });
    } catch (err) { next(err); }
  }
);

router.get('/audit-log', requireAuth, requireSuperAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const [rows, totalRows] = await Promise.all([
      query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, (page - 1) * limit]),
      query('SELECT COUNT(*) AS total FROM audit_logs', []),
    ]);
    res.json({ logs: rows.map(mapAuditLog), total: Number(totalRows[0]?.total || 0), page, pages: Math.ceil(Number(totalRows[0]?.total || 0) / limit) || 1 });
  } catch (err) { next(err); }
});

router.delete('/audit-log/clear', requireAuth, requireSuperAdmin,
  [body('password').notEmpty().withMessage('Password is required.')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ message: errors.array()[0].msg });

      const me = await findUserById(req.user._id);
      const ok = await me.comparePassword(req.body.password);
      if (!ok) return res.status(401).json({ message: 'Incorrect password.' });

      const result = await execute('DELETE FROM audit_logs', []);
      res.json({ message: `${result.affectedRows} audit log entries deleted.`, deletedCount: result.affectedRows });
    } catch (err) { next(err); }
  }
);

router.delete('/orders/clear', requireAuth, requireSuperAdmin,
  [body('password').notEmpty().withMessage('Password is required.')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ message: errors.array()[0].msg });

      const me = await findUserById(req.user._id);
      const ok = await me.comparePassword(req.body.password);
      if (!ok) return res.status(401).json({ message: 'Incorrect password.' });

      const result = await execute('DELETE FROM orders', []);
      res.json({ message: `${result.affectedRows} orders deleted.`, deletedCount: result.affectedRows });
    } catch (err) { next(err); }
  }
);

router.post('/sync-csv', requireAuth, requireSuperAdmin, async (req, res) => {
  syncStatus = {
    running: false,
    done: true,
    matched: 0,
    updated: 0,
    skipped: 0,
    error: 'CSV sync is not available after Mongo removal. Use MySQL import scripts.',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
  };
  res.status(503).json({ message: syncStatus.error, status: syncStatus });
});

router.get('/sync-csv/status', requireAuth, requireAdmin, async (req, res) => {
  res.json(syncStatus);
});

module.exports = router;