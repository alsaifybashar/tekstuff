const fs = require('fs');
const path = require('path');

function checkRequires(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  const requires = new Set();
  
  for (const file of files) {
    if (file.isDirectory()) {
      checkRequires(path.join(dir, file.name)).forEach(req => requires.add(req));
    } else if (file.name.endsWith('.js')) {
      const content = fs.readFileSync(path.join(dir, file.name), 'utf8');
      const matches = content.match(/require\(['"]([^'"]+)['"]\)/g);
      if (matches) {
        matches.forEach(match => {
          const module = match.match(/require\(['"]([^'"]+)['"]\)/)[1];
          if (!module.startsWith('.') && !module.startsWith('/')) {
            requires.add(module);
          }
        });
      }
    }
  }
  
  return requires;
}

console.log('Required modules found in your code:');
const allRequires = checkRequires('.');
[...allRequires].sort().forEach(req => console.log(`- ${req}`));
