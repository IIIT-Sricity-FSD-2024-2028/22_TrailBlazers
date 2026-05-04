const fs = require('fs');

// 1. Check profile-init.js
const initScript = fs.readFileSync('profile-init.js', 'utf8');
console.log('=== profile-init.js ===');
console.log('Has getUser():', initScript.includes('function getUser'));
console.log('Has roleLabel():', initScript.includes('function roleLabel'));
console.log('SU selectors:', initScript.includes('.header-user-name'));
console.log('OSC acct-header-info:', initScript.includes('.acct-header-info'));
console.log('EM nav-user-name:', initScript.includes('.nav-user-name'));
console.log('avatar-button:', initScript.includes('.avatar-button'));
console.log('coordinator-label:', initScript.includes('.coordinator-label'));
console.log('pb pi items:', initScript.includes('.pb .pi'));
console.log('settings modal:', initScript.includes('global-settings-modal'));

// 2. Check auth.js
const authJs = fs.readFileSync('landing-page/auth.js', 'utf8');
console.log('\n=== auth.js ===');
console.log('Stores ALL users:', authJs.includes('Store ALL users under both keys'));
console.log('No attendee exclusion:', !authJs.includes("if (matched.role !== 'attendee')"));

// 3. Check script tags
const files = {
    'SU Dashboard': 'super-user/dashboard.html',
    'SU User Mgmt': 'super-user/user-management.html',
    'OSC Scanner':  'osc/scanner.html',
    'OSC Report':   'osc/report.html',
    'EM Home':      'event-manager/home.html',
    'EM Dashboard': 'event-manager/dashboard.html',
};
console.log('\n=== HTML script tags ===');
Object.entries(files).forEach(function(entry) {
    const name = entry[0], file = entry[1];
    const content = fs.readFileSync(file, 'utf8');
    console.log(name + ': ' + (content.includes('profile-init.js') ? 'INJECTED' : 'MISSING'));
});

// 4. Users
console.log('\n=== Test Credentials ===');
const users = JSON.parse(fs.readFileSync('backend/data/users.json', 'utf8'));
['superuser', 'eventmanager', 'osc', 'client', 'attendee'].forEach(function(role) {
    const u = users.find(function(u) { return u.role === role; });
    if (u) console.log(role + ': ' + u.name + ' <' + u.email + '>');
});
