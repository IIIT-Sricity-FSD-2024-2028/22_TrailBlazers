const fs = require('fs');
const path = require('path');

const seedPath = path.resolve(__dirname, '../src-nestjs/seed/seed-data/initial-seed.data.ts');
let content = fs.readFileSync(seedPath, 'utf8');

const replacements = [
  ['"contactEmail": "sarah2@techfuture.org"', '"contactEmail": "sarah2@gmail.com"'],
  ['"contactEmail": "roshan@eventos.org"', '"contactEmail": "roshan@gmail.com"'],
  ['"contactEmail": "bharat@eventos.org"', '"contactEmail": "bharat@gmail.com"'],
  ['"contactEmail": "nandhan@eventorgs.com"', '"contactEmail": "nandhan@gmail.com"'],
  ['"contactEmail": "spoof@org.com"', '"contactEmail": "ananya.sharma@gmail.com"'],
  ['"contactEmail": "client@test.com"', '"contactEmail": "manish.malhotra@gmail.com"'],
  ['"contactEmail": "contact@cloud.com"', '"contactEmail": "siddhardha.roy@gmail.com"'],
  ['"contactEmail": "contact@fin.com"', '"contactEmail": "siddhardha.roy@gmail.com"'],
  ['"contactEmail": "ai@org.com"', '"contactEmail": "siddhardha.roy2@gmail.com"'],
  ['"contactEmail": "cloud@org.com"', '"contactEmail": "siddhardha.roy2@gmail.com"'],
  ['"recipientEmail": "otheruser@example.com"', '"recipientEmail": "other.person@gmail.com"'],
  ['"recipientEmail": "executive@company.com"', '"recipientEmail": "executive@gmail.com"']
];

let applied = 0;
for (const [target, repl] of replacements) {
  if (content.includes(target)) {
    content = content.split(target).join(repl);
    applied++;
  }
}

fs.writeFileSync(seedPath, content, 'utf8');
console.log('Seed replacements applied:', applied);
