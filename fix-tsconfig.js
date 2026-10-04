const fs = require('fs');
let s = fs.readFileSync('tsconfig.json', 'utf8');
s = s.replace('"exclude": ["node_modules"]', '"exclude": ["node_modules", "prisma/seed.ts", "prisma/seed.mjs", "fix-schema.js", "fix-schema2.js"]');
fs.writeFileSync('tsconfig.json', s);
console.log('Excluded seed and fix scripts from tsconfig');
