const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
let allSql = '';
for (const file of fs.readdirSync(migrationsDir).sort()) {
    if (file.endsWith('.sql')) {
        allSql += fs.readFileSync(path.join(migrationsDir, file), 'utf8') + '\n\n';
    }
}

const tables = [];
const tableRegex = /CREATE TABLE (?:IF NOT EXISTS\s+)?(?:public\.)?(\w+)/gi;
let match;
while ((match = tableRegex.exec(allSql)) !== null) {
    tables.push(match[1]);
}

const insertPolicies = [];
const insertRegex = /ON (\w+) FOR INSERT/gi;
while ((match = insertRegex.exec(allSql)) !== null) {
    insertPolicies.push(match[1]);
}

const missing = tables.filter(t => !insertPolicies.includes(t));
console.log("Tables missing INSERT policies:", missing.join(', '));
