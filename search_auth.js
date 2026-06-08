const fs = require('fs');
const path = require('path');

const searchRegex = /localhost|127\.0\.0\.1|5173|redirectTo|NEXT_PUBLIC_APP_URL|NEXT_PUBLIC_SITE_URL/i;
const ignoreDirs = ['node_modules', '.next', '.git'];

const results = [];

function searchDir(dir) {
    if (!fs.existsSync(dir)) return;
    const stat = fs.statSync(dir);
    if (!stat.isDirectory()) {
        checkFile(dir);
        return;
    }
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const fStat = fs.statSync(fullPath);
        if (fStat.isDirectory()) {
            if (!ignoreDirs.includes(file)) {
                searchDir(fullPath);
            }
        } else {
            checkFile(fullPath);
        }
    }
}

function checkFile(fullPath) {
    if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.json') || fullPath.endsWith('.env') || fullPath.endsWith('.env.local')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (searchRegex.test(lines[i])) {
                results.push(`${fullPath}:${i + 1}:${lines[i].trim()}`);
            }
        }
    }
}

searchDir(path.join(__dirname, 'app'));
searchDir(path.join(__dirname, 'components'));
searchDir(path.join(__dirname, 'lib'));
searchDir(path.join(__dirname, 'supabase'));
if (fs.existsSync(path.join(__dirname, '.env.local'))) {
    searchDir(path.join(__dirname, '.env.local'));
}

fs.writeFileSync('auth_audit_results.txt', results.join('\n'));
console.log('Search complete. Found ' + results.length + ' matches.');
