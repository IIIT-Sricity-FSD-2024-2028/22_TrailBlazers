const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function updatePasswords() {
  const storePath = path.join(__dirname, '..', 'data', 'store-data.json');
  const raw = fs.readFileSync(storePath, 'utf8');
  const data = JSON.parse(raw);

  const newHash = await bcrypt.hash('Password123!', 10);
  console.log('Generated bcrypt hash for Password123!:', newHash);

  let updatedCount = 0;
  if (data.users) {
    if (Array.isArray(data.users)) {
      for (const u of data.users) {
        u.passwordHash = newHash;
        updatedCount++;
      }
    } else {
      for (const [id, u] of Object.entries(data.users)) {
        u.passwordHash = newHash;
        updatedCount++;
      }
    }
  }

  fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Successfully updated ${updatedCount} user accounts in store-data.json with default password "Password123!".`);
}

updatePasswords().catch(err => {
  console.error('Error updating passwords:', err);
  process.exit(1);
});
