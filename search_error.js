const fs = require('fs');
const path = require('path');

const searchRegex = /Database error saving new user/i;
const ignoreDirs = ['node_modules', '.next', '.git'];

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

searchDir(path.join(__dirname, 'app'));
searchDir(path.join(__dirname, 'components'));
searchDir(path.join(__dirname, 'lib'));
searchDir(path.join(__dirname, 'supabase'));

fs.writeFileSync('error_search_results.txt', results.join('\n'));
console.log('Search complete. Found ' + results.length + ' matches.');
