const fs = require('fs');

function checkFile(f) {
    if (fs.existsSync(f)) {
        console.log('--- ' + f + ' ---');
        const content = fs.readFileSync(f, 'utf8');
        const match = content.match(/<div class="(header-user|nav-profile|profile)[^>]*>[\s\S]*?<\/div>\s*<\/div>/i);
        if (match) {
            console.log(match[0].substring(0, 500));
        } else {
            console.log('No match in ' + f);
        }
    }
}

checkFile('osc/dashboard.html');
checkFile('event-manager/dashboard.html');
checkFile('event-manager/home.html');
checkFile('client/dashboard.html');
checkFile('client/client.html');
checkFile('client/dashboard.html');
