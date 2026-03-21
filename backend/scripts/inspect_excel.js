const XLSX = require('xlsx');
const path = require('path');

// Check Sheet2 of item-list
const file = path.join(__dirname, '../../../886955516-item-list.xlsx');
const wb = XLSX.readFile(file, { raw: false });
const ws2 = wb.Sheets['Sheet2'];
const rawRows2 = XLSX.utils.sheet_to_json(ws2, { defval: '', header: 1 });
console.log('Sheet2 total rows:', rawRows2.length);
rawRows2.slice(0,6).forEach((r,i) => console.log('Row',i,':', JSON.stringify(r)));

// Garnier, Maybelline as L'Oreal sub-brands; check item names in both sheets
for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 });
  const brands = ['loreal', "l'oreal", 'garnier', 'maybelline', 'streax', 'wella', 'revlon'];
  brands.forEach(brand => {
    const count = rows.filter(r => r.some(c => String(c).toLowerCase().includes(brand))).length;
    if (count > 0) console.log(`Sheet ${sheetName} - ${brand}: ${count} rows`);
  });
}
