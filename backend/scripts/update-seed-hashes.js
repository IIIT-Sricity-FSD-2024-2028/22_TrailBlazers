const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src-nestjs', 'seed', 'seed-data', 'initial-seed.data.ts');
let content = fs.readFileSync(filePath, 'utf8');

const dummy = '$2b$10$EV5kp8xEEVFO3RynujWINeqHbOW49r8p5HxpLXDqkp.TBVF0IMiDe.qyFNeD81pJdz6CY58GFry08M/kB1kKC';
const validHash = '$2b$10$Kj9osirUYCl8orDKBt6Pp.NpVTUiYIcXjqRR7.0FnT.9pM7uaapkm';

const count = (content.match(new RegExp(dummy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
console.log(`Found ${count} occurrences in initial-seed.data.ts`);

content = content.replaceAll(dummy, validHash);
fs.writeFileSync(filePath, content, 'utf8');
console.log(`Replaced all occurrences with valid hash for Password123!`);
