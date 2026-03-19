const multer = require('multer');

const ALLOWED_IMG_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Memory storage — file buffer kept in memory for further processing
const storage = multer.memoryStorage();

// ── Image / PDF uploader (product images, prescription files) ─────────────────
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMG_TYPES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_FILE_SIZE },
});

// ── Spreadsheet uploader (Excel .xlsx / .xls and .csv) ───────────────────────
// Some browsers send application/octet-stream for xlsx, so we also check extension.
const SHEET_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
  'application/octet-stream',
];
const SHEET_EXTS = ['xlsx', 'xls', 'csv'];

const uploadSpreadsheet = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = (file.originalname || '').split('.').pop().toLowerCase();
    if (SHEET_TYPES.includes(file.mimetype) || SHEET_EXTS.includes(ext)) return cb(null, true);
    cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed.'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB for spreadsheets
});

module.exports = upload;
module.exports.uploadSpreadsheet = uploadSpreadsheet;
