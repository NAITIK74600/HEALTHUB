// Fix ALL mojibake in AdminCategories.jsx
const fs = require('fs');
const filePath = 'frontend/src/pages/admin/AdminCategories.jsx';
const content = fs.readFileSync(filePath, 'utf8');

const newBlock = `/* \u2500\u2500\u2500 Quick-pick icons for medical/pharma categories \u2500\u2500\u2500 */
const ICON_OPTIONS = [
  '\u{1F48A}','\u{1FA7A}','\u{1F3E5}','\u{1F9EA}','\u{1F489}','\u{1FA79}','\u2764\uFE0F','\u{1F9E0}','\u{1F441}\uFE0F','\u{1F9B7}','\u{1F9B4}','\u{1F4AA}',
  '\u{1F33F}','\u{1F343}','\u{1F9F4}','\u{1F9FC}','\u{1F476}','\u{1F469}','\u{1F468}','\u{1F9D4}','\u{1F338}','\u{1F52C}','\u2695\uFE0F','\u{1FAC0}',
  '\u{1F9EC}','\u{1FA7B}','\u{1FA78}','\u{1F486}','\u{1F3C3}','\u{1F9D8}','\u{1F6CC}','\u{1F957}','\u{1F4A7}','\u{1F321}\uFE0F','\u{1F4E6}','\u{1F3AF}',
];

/* \u2500\u2500\u2500 Virtual lifestyle categories \u2014 matched by keyword search, not category_id \u2500\u2500\u2500 */
const LIFESTYLE_CATS = [
  { slug: 'hair-care',          label: 'Hair Care',            icon: '\u2702\uFE0F' },
  { slug: 'skin-care',          label: 'Skin Care',            icon: '\u{1F9F4}' },
  { slug: 'baby-care',          label: 'Baby Care',            icon: '\u{1F476}' },
  { slug: 'fitness-health',     label: 'Fitness & Health',     icon: '\u{1F3C3}' },
  { slug: 'vitamins-nutrition', label: 'Vitamins & Nutrition', icon: '\u{1F48A}' },
  { slug: 'diabetes-care',      label: 'Diabetes Care',        icon: '\u{1F321}\uFE0F' },
  { slug: 'supports-braces',    label: 'Supports & Braces',    icon: '\u{1F9B4}' },
  { slug: 'immunity-boosters',  label: 'Immunity Boosters',    icon: '\u{1F33F}' },
  { slug: 'sexual-wellness',    label: 'Sexual Wellness',      icon: '\u2764\uFE0F' },
  { slug: 'oral-care',          label: 'Oral Care',            icon: '\u{1F9B7}' },
  { slug: 'women-care',         label: "Women's Care",         icon: '\u{1F469}' },
  { slug: 'men-grooming',       label: 'Men Grooming',         icon: '\u{1F9D4}' },
  { slug: 'elderly-care',       label: 'Elderly Care',         icon: '\u{1F6CC}' },
];`;

// Step 1: Replace ICON_OPTIONS block
// Step 1: Replace ICON_OPTIONS block including its comment header
// The comment contains 'Quick-pick' — anchor on that to include the comment line
const qpIdx = content.indexOf('Quick-pick');
const startComment = content.lastIndexOf('\n', qpIdx) + 1; // start of `/* ─── Quick-pick...` line
const startMarker = 'const ICON_OPTIONS';
const end = content.indexOf('];\n', content.indexOf(startMarker)) + 3;

console.log(`Step1: Replacing chars ${startComment}..${end} (comment starts at ${qpIdx})`);
let result = content.slice(0, startComment) + newBlock + '\n' + content.slice(end);

// Step 2: Fix all UI text mojibake
// Each pair: [oldBytes-as-JS-string, newCorrectString]
const fixes = [
  // 📂 folder (default icon preview) — F0 9F 93 82 double-encoded
  ['\u00F0\u0178\u201C\u201A', '\uD83D\uDCC2'],
  // middle dot · — C2 B7 encoded as Â·
  ['\u00C2\u00B7', '\u00B7'],
  // ellipsis … — E2 80 A6 encoded as â€¦
  ['\u00E2\u20AC\u00A6', '\u2026'],
  // em dash — — E2 80 94 encoded as â€"
  ['\u00E2\u20AC\u201D', '\u2014'],
  // ➕ heavy plus — F0 9F 95 BA double-encoded as âž•
  ['\u00E2\u017E\u2022', '\u2795'],
  // ✏️ pencil — U+270F U+FE0F double-encoded; 0x8F in Win-1252 is undefined → stored as U+008F
  ['\u00E2\u0153\u008F\u00EF\u00B8\u008F', '\u270F\uFE0F'],
  // minus sign − — E2 88 92 encoded as âˆ'
  ['\u00E2\u02C6\u2019', '\u2212'],
];

for (const [bad, good] of fixes) {
  const count = result.split(bad).length - 1;
  result = result.split(bad).join(good);
  if (count > 0) console.log(`Fixed ${count}x "${bad}" -> "${good}"`);
}

fs.writeFileSync(filePath, result, 'utf8');
console.log('SUCCESS: File updated');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
console.log('ICON_OPTIONS preview:', JSON.stringify(verify.slice(verify.indexOf('const ICON_OPTIONS'), verify.indexOf('const ICON_OPTIONS') + 80)));
console.log('LIFESTYLE_CATS found:', verify.indexOf('LIFESTYLE_CATS') > 0);
// Check no mojibake remains
const hasMoji = verify.includes('\u00E2\u20AC\u00A6') || verify.includes('\u00C2\u00B7') || verify.includes('\u00F0\u0178\u201C');
console.log('Mojibake remaining:', hasMoji);
console.log('File length:', verify.length);
