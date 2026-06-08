const fs = require('fs');
const path = require('path');

function searchFiles(dir, regex, extension) {
    const results = [];
    function scan(d) {
        if (!fs.existsSync(d)) return;
        for (const file of fs.readdirSync(d)) {
            const fp = path.join(d, file);
            if (fs.statSync(fp).isDirectory() && !['node_modules', '.git', '.next'].includes(file)) {
                scan(fp);
            } else if (file.endsWith(extension)) {
                const content = fs.readFileSync(fp, 'utf8');
                if (regex.test(content)) {
                    results.push(`${fp}: Match found`);
                }
            }
        }
    }
    scan(dir);
    return results;
}

const inserts = searchFiles(path.join(__dirname, 'app'), /\.from\(['"`]companies['"`]\)\.insert/i, '.tsx');
const moreInserts = searchFiles(path.join(__dirname, 'app'), /\.from\(['"`]companies['"`]\)\.insert/i, '.ts');
const rls = searchFiles(path.join(__dirname, 'supabase', 'migrations'), /ON companies FOR INSERT/i, '.sql');

console.log("Companies Inserts:", inserts.concat(moreInserts));
console.log("Companies INSERT RLS:", rls);
