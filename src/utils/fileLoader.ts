const fs = require('fs');

export function loadFile(filepath: string) {
    return fs.readFileSync(filepath, 'utf8');
}