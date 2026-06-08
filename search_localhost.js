const fs = require('fs');
const path = require('path');

const searchRegex = /localhost/i;
const dirsToSearch = ['app', 'components', 'lib', 'supabase'];
const ignoreDirs = ['node_modules', '.next'];

const results = [];

function searchDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (!ignoreDirs.includes(file)) {
                searchDir(fullPath);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (searchRegex.test(lines[i])) {
                    results.push(`${fullPath}:${i + 1}:${lines[i].trim()}`);
                }
            }
        }
    }
}

dirsToSearch.forEach(dir => searchDir(path.join(__dirname, dir)));

fs.writeFileSync('localhost_search_results.txt', results.join('\n'));
console.log('Search complete. Found ' + results.length + ' matches.');
