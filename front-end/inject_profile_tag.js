const fs = require('fs');
const path = require('path');

// Map: folder → relative path to profile-init.js
const portals = [
    { dir: 'super user',  scriptTag: '<script src="../profile-init.js"></script>' },
    { dir: 'osc',         scriptTag: '<script src="../profile-init.js"></script>' },
    { dir: 'Project',     scriptTag: '<script src="../profile-init.js"></script>' },
    { dir: 'front-end',   scriptTag: '<script src="../profile-init.js"></script>' },
];

let totalModified = 0;

portals.forEach(({ dir, scriptTag }) => {
    if (!fs.existsSync(dir)) {
        console.log('SKIP (not found):', dir);
        return;
    }

    fs.readdirSync(dir).filter(f => f.endsWith('.html')).forEach(file => {
        const filepath = path.join(dir, file);
        let html = fs.readFileSync(filepath, 'utf8');

        // Skip if already injected
        if (html.includes('profile-init.js')) {
            console.log('Already has profile-init:', filepath);
            return;
        }

        // Insert before </body>
        if (html.includes('</body>')) {
            html = html.replace('</body>', `    ${scriptTag}\n</body>`);
            fs.writeFileSync(filepath, html, 'utf8');
            console.log('Injected into:', filepath);
            totalModified++;
        } else {
            // Append at end
            html += `\n${scriptTag}\n`;
            fs.writeFileSync(filepath, html, 'utf8');
            console.log('Appended to:', filepath);
            totalModified++;
        }
    });
});

console.log('\nDone. Modified', totalModified, 'HTML files.');
