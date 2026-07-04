const fs = require('fs');
const path = require('path');

function replaceColors(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceColors(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We only want to replace tailwind utility classes, not any JS string that happens to contain "text-white"
      content = content.replace(/text-white\b(?!\/)/g, 'text-foreground');
      content = content.replace(/border-white\/10\b/g, 'border-border');
      content = content.replace(/border-white\/5\b/g, 'border-border/50');
      content = content.replace(/bg-white\/5\b/g, 'bg-muted');
      content = content.replace(/bg-black\/20\b/g, 'bg-background/50');
      content = content.replace(/bg-white\/10\b/g, 'bg-muted/80');
      content = content.replace(/text-white\/([0-9]+)/g, 'text-foreground/$1');
      content = content.replace(/bg-\[#0B0D17\]/g, 'bg-background');

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

replaceColors(path.join(__dirname, 'src'));
console.log('Replaced colors successfully!');
