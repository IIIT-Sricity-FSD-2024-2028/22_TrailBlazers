const fs = require('fs');
const bcrypt = require('bcryptjs');

const data = JSON.parse(fs.readFileSync('./data/store-data.json', 'utf8'));
const users = Object.values(data.users);

console.log('Total users:', users.length);

const hashes = {};
users.forEach(u => {
  hashes[u.passwordHash] = (hashes[u.passwordHash] || 0) + 1;
});
console.log('Unique hashes:', hashes);

const candidates = [
  'password123!',
  'password123',
  'password',
  '123456',
  'admin123',
  'wavevents123',
  'password!123',
  'Admin@123',
  'Admin123!',
  'SuperAdmin@123',
  'SuperAdmin123!',
  'Secret123!',
  'test1234',
  'changeme',
  'welcome',
  'welcome123',
  'Wavevents@2026',
  'Wavevents123!',
  'Wavevents@123',
  'rahul123',
  'manish123',
  'evil123'
];

for (const [hash, count] of Object.entries(hashes)) {
  console.log(`\nHash: ${hash} (count: ${count}, len: ${hash ? hash.length : 0})`);
  let found = false;
  for (const p of candidates) {
    try {
      if (bcrypt.compareSync(p, hash)) {
        console.log(`  -> MATCHED password: "${p}"`);
        found = true;
        break;
      }
    } catch (e) {
      console.log(`  -> bcrypt error: ${e.message}`);
      break;
    }
  }
  if (!found) {
    console.log('  -> No candidate matched.');
  }
}
