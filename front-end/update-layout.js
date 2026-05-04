const fs = require('fs');
const path = require('path');

const tasks = [
    {
        dir: 'super user',
        regexSidebar: /<div class="sidebar-brand">[\s\S]*?<span class="sidebar-brand-text">Wevents\.com<\/span><\/div>/,
        replaceSidebar: '',
        regexHeader: /<div class="header-left">/,
        replaceHeader: `<div class="header-left" style="display:flex; align-items:center;">
            <div style="display:flex; align-items:center; gap:8px; margin-right:24px;">
                <div style="background:var(--accent); color:white; width:30px; height:30px; border-radius:6px; display:flex; align-items:center; justify-content:center;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><rect x="8" y="14" width="3" height="3" fill="currentColor"/></svg>
                </div>
                <span style="font-weight:700; font-size:16px; color:var(--text-primary);">Wevents.com</span>
            </div>`
    },
    {
        dir: 'Project',
        regexSidebar: /<div class="logo">\s*<div class="logo-icon"><i class="fa-regular fa-calendar"><\/i><\/div>\s*Wevents\.com\s*<\/div>/,
        replaceSidebar: '',
        regexHeader: /<div class="navbar(?:[^>]*)">/,
        replaceHeader: `<div class="navbar" style="position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 1px solid #e2e8f0; border-radius: 0;">
            <div style="display:flex; align-items:center; gap:10px; color:var(--primary); font-size: 18px; font-weight: 700; margin-left: 10px;">
              <div style="width: 32px; height: 32px; background: var(--primary); color: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center;"><i class="fa-regular fa-calendar"></i></div> Wevents.com
            </div>`
    },
    {
        dir: 'f2',
        regexSidebar: /<div class="brand">[\s\S]*?<span class="brand-name">Wevents\.com<\/span>\s*<\/div>/,
        replaceSidebar: '',
        regexHeader: /<div class="header-top">/,
        replaceHeader: `<div class="header-top" style="position: sticky; top: 0; z-index: 100;">
          <div style="display:flex; align-items:center; gap:10px; margin-right:auto; padding-left:20px; color:#f97316; font-size: 18px; font-weight: 700;">
            <div style="width: 32px; height: 32px; background: #f97316; color: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-calendar"></i></div> Wevents.com
          </div>`
    },
    {
        dir: 'front-end',
        regexSidebar: /<div class="sidebar-header"[^>]*>[\s\S]*?<h2[^>]*>Wevents\.com<\/h2>\s*<\/div>/,
        replaceSidebar: '',
        regexHeader: /<header class="topbar">/,
        replaceHeader: `<header class="topbar" style="position: sticky; top: 0; z-index: 100; background: #1646D0;">
                <div style="display:flex; align-items:center; gap:10px; margin-right:20px;">
                    <div style="width: 32px; height: 32px; background: #F97316; color: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="4" y="5" width="16" height="15" rx="2" stroke="#FFFFFF" stroke-width="2.5"/>
                            <path d="M4 10H20" stroke="#FFFFFF" stroke-width="2.5"/>
                            <path d="M8 3V7" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
                            <path d="M16 3V7" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
                            <rect x="8" y="14" width="3" height="3" fill="#FFFFFF"/>
                        </svg>
                    </div>
                    <h2 style="color:#FFFFFF; font-size: 18px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Wevents.com</h2>
                </div>`
    }
];

tasks.forEach(task => {
    const dirPath = path.join(__dirname, task.dir);
    if (!fs.existsSync(dirPath)) return;
    
    fs.readdirSync(dirPath).forEach(file => {
        if (!file.endsWith('.html')) return;
        
        const filePath = path.join(dirPath, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        let modified = false;
        
        // Debug output for front-end dashboard
        if (file === 'dashboard.html' && task.dir === 'front-end') {
            console.log("Checking front-end/dashboard.html", {
                sidebarMatch: task.regexSidebar.test(content),
                headerMatch: task.regexHeader.test(content)
            });
        }
        if (file === 'dashboard.html' && task.dir === 'Project') {
            console.log("Checking Project/dashboard.html", {
                 sidebarMatch: task.regexSidebar.test(content),
                 headerMatch: task.regexHeader.test(content)
            });
        }
        
        if (task.regexSidebar.test(content) && task.regexHeader.test(content)) {
            content = content.replace(task.regexSidebar, task.replaceSidebar);
            content = content.replace(task.regexHeader, task.replaceHeader);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${task.dir}/${file}`);
        } else if (file === 'dashboard.html' || file.includes('index')) {
            if (task.regexSidebar.test(content)) {
                 if (!task.regexHeader.test(content)) {
                     console.log(`Matched sidebar, but missed header in ${task.dir}/${file}`);
                 }
            } else {
                 console.log(`Missed sidebar in ${task.dir}/${file}`);
            }
        }
    });
});
console.log('Script completed.');
