const fs = require('fs');

function checkFile(f) {
    if (fs.existsSync(f)) {
        console.log('--- ' + f + ' ---');
        const content = fs.readFileSync(f, 'utf8');
        const match = content.match(/<header[^>]*>[\s\S]*?<\/header>/);
        if (match) {
            console.log(match[0].substring(0, 500));
        } else {
            console.log('No header tag match');
        }
    }
}

checkFile('client/index.html');
checkFile('client/client.html');
checkFile('attendee/attendee.html');
checkFile('osc/osc.html');
