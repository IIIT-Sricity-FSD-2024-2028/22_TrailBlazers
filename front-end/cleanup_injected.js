const fs = require('fs');
const path = require('path');

const START_MARKER = '// --- AUTO-INJECTED PROFILE HEADER SCRIPT ---';
const END_MARKER   = '// --- END AUTO-INJECTED ---';

const dirs = ['super user', 'Project', 'osc', 'front-end', 'f2'];
let totalCleaned = 0;

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).filter(f => f.endsWith('.js')).forEach(file => {
        const filepath = path.join(dir, file);
        let content = fs.readFileSync(filepath, 'utf8');

        if (!content.includes(START_MARKER)) return;

        // Remove everything from START_MARKER to END_MARKER (inclusive)
        const startIdx = content.indexOf(START_MARKER);
        const endIdx   = content.indexOf(END_MARKER);

        if (startIdx !== -1 && endIdx !== -1) {
            const before = content.substring(0, startIdx).trimEnd();
            const after  = content.substring(endIdx + END_MARKER.length).trimStart();
            content = before + (after ? '\n' + after : '');
            fs.writeFileSync(filepath, content, 'utf8');
            console.log('Cleaned:', filepath);
            totalCleaned++;
        }
    });
});

console.log('\nDone. Cleaned', totalCleaned, 'JS files.');
