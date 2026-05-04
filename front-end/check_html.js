const fs = require('fs');

function checkFile(f) {
    if (fs.existsSync(f)) {
        console.log('--- ' + f + ' ---');
        const content = fs.readFileSync(f, 'utf8');
        const match = content.match(/<div class="header-user"[^>]*>[\s\S]*?<\/header>/);
        if (match) {
            console.log(match[0].substring(0, 1000));
        } else {
            console.log('No match');
        }
    }
}

checkFile('super-user/dashboard.html');
checkFile('client/index.html');
