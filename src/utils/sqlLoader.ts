const fs = require('fs');

export function loadSqlFile(filepath: string) {
    return fs.readFileSync(filepath, 'utf8');
}