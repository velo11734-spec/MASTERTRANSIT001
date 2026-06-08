const fs = require('fs');
const path = require('path');

const searchRegex = /localhost|127\.0\.0\.1|5173/i;
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
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.json') || file.endsWith('.env') || file.endsWith('.env.local') || file.endsWith('.toml')) {
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

searchDir(__dirname);

fs.writeFileSync('localhost_search_results2.txt', results.join('\n'));
console.log('Search complete. Found ' + results.length + ' matches.');
