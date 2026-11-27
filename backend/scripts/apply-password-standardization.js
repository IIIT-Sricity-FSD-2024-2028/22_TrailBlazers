const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('--- Setting Password123! for all users ---');
  const targetPassword = 'Password123!';
  const newHash = await bcrypt.hash(targetPassword, 10);
  console.log('Generated bcrypt hash:', newHash);

  // Validate format and comparisons
  const regex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
  if (!regex.test(newHash)) {
    throw new Error('Generated hash does not match bcrypt regex!');
  }
  if (!bcrypt.compareSync(targetPassword, newHash)) {
    throw new Error('bcrypt.compareSync failed for target password!');
  }
  if (bcrypt.compareSync('wrongPassword', newHash) || bcrypt.compareSync('password123', newHash)) {
    throw new Error('bcrypt.compareSync falsely matched invalid password!');
  }
  console.log('Bcrypt hash verified successfully.');

  // 1. Update store-data.json
  const storePath = path.join(__dirname, '..', 'data', 'store-data.json');
  const storeRaw = fs.readFileSync(storePath, 'utf8');
  const storeData = JSON.parse(storeRaw);

  let storeUpdatedCount = 0;
  if (storeData.users) {
    for (const [id, user] of Object.entries(storeData.users)) {
      user.passwordHash = newHash;
      storeUpdatedCount++;
    }
  }
  fs.writeFileSync(storePath, JSON.stringify(storeData, null, 2), 'utf8');
  console.log(`Updated ${storeUpdatedCount} user accounts in store-data.json.`);

  // 2. Update initial-seed.data.ts
  const seedPath = path.join(__dirname, '..', 'src-nestjs', 'seed', 'seed-data', 'initial-seed.data.ts');
  let seedContent = fs.readFileSync(seedPath, 'utf8');

  // Replace all "passwordHash": "..." occurrences in initial-seed.data.ts
  const oldSeedMatches = seedContent.match(/"passwordHash":\s*"[^"]+"/g);
  console.log(`Found ${oldSeedMatches ? oldSeedMatches.length : 0} passwordHash entries in initial-seed.data.ts.`);

  seedContent = seedContent.replace(/"passwordHash":\s*"[^"]+"/g, `"passwordHash": "${newHash}"`);
  fs.writeFileSync(seedPath, seedContent, 'utf8');
  console.log(`Updated all passwordHash entries in initial-seed.data.ts.`);

  // 3. Verify updates
  const reReadStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  let storeVerifiedCount = 0;
  for (const [id, user] of Object.entries(reReadStore.users || {})) {
    if (user.passwordHash === newHash && bcrypt.compareSync(targetPassword, user.passwordHash)) {
      storeVerifiedCount++;
    } else {
      console.error(`Verification FAILED for user ${id} (${user.email})!`);
    }
  }

  const reReadSeed = fs.readFileSync(seedPath, 'utf8');
  const seedVerifiedCount = reReadSeed.split(`"passwordHash": "${newHash}"`).length - 1;

  console.log(`Verification result:`);
  console.log(`- Store accounts updated & verified: ${storeVerifiedCount} / ${storeUpdatedCount}`);
  console.log(`- Seed accounts updated & verified: ${seedVerifiedCount} / ${oldSeedMatches ? oldSeedMatches.length : 0}`);

  if (storeVerifiedCount !== storeUpdatedCount || seedVerifiedCount !== oldSeedMatches.length) {
    throw new Error('Mismatch in verified accounts count!');
  }
  console.log('ALL ACCOUNTS SUCCESSFULLY UPDATED AND VERIFIED!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
