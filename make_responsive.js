const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Wrap tables
    if (content.includes('<table') && !content.includes('mt-table-wrap')) {
        content = content.replace(/<table([\s\S]*?)<\/table>/g, (match) => {
            // Check if it's already wrapped in overflow-x-auto
            if (content.includes('overflow-x-auto') && content.indexOf(match) > content.indexOf('overflow-x-auto')) {
                return match;
            }
            return `<div className="mt-table-wrap">\n${match}\n</div>`;
        });
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated: ${filePath}`);
    }
}

function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            processFile(fullPath);
        }
    });
}

walkDir(path.join(__dirname, 'app'));
walkDir(path.join(__dirname, 'components'));
