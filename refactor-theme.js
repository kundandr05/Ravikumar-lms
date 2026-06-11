const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /\bbg-white\b/g, replacement: 'bg-card text-card-foreground' },
  { regex: /\bbg-slate-50\b/g, replacement: 'bg-muted\/50' },
  { regex: /\bbg-slate-100\b/g, replacement: 'bg-muted' },
  { regex: /\btext-slate-900\b/g, replacement: 'text-foreground' },
  { regex: /\btext-slate-800\b/g, replacement: 'text-foreground' },
  { regex: /\btext-slate-700\b/g, replacement: 'text-foreground' },
  { regex: /\btext-slate-600\b/g, replacement: 'text-muted-foreground' },
  { regex: /\btext-slate-500\b/g, replacement: 'text-muted-foreground' },
  { regex: /\btext-slate-400\b/g, replacement: 'text-muted-foreground' },
  { regex: /\border-slate-100\b/g, replacement: 'border-border' },
  { regex: /\border-slate-200\b/g, replacement: 'border-border' },
  { regex: /\border-slate-300\b/g, replacement: 'border-border' },
  { regex: /\bring-slate-200\b/g, replacement: 'ring-ring' },
  { regex: /\bring-slate-300\b/g, replacement: 'ring-ring' },
  { regex: /\bdivide-slate-200\b/g, replacement: 'divide-border' },
  { regex: /\bhover:bg-slate-50\b/g, replacement: 'hover:bg-accent hover:text-accent-foreground' },
  { regex: /\bhover:bg-slate-100\b/g, replacement: 'hover:bg-accent hover:text-accent-foreground' },
  { regex: /\bhover:bg-slate-200\b/g, replacement: 'hover:bg-accent hover:text-accent-foreground' },
  { regex: /\bhover:text-slate-900\b/g, replacement: 'hover:text-accent-foreground' },
  { regex: /\bhover:text-slate-800\b/g, replacement: 'hover:text-accent-foreground' },
];

function processFile(filePath) {
  // Skip modifying the components/ui/ directory as Shadcn components are already optimized
  if (filePath.includes('src\\components\\ui') || filePath.includes('src/components/ui')) {
    return;
  }
  // Skip Navbar since I already updated it
  if (filePath.includes('Navbar.tsx')) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  // Clean up potential duplicate classes
  content = content.replace(/text-card-foreground text-card-foreground/g, 'text-card-foreground');
  content = content.replace(/text-foreground text-foreground/g, 'text-foreground');
  content = content.replace(/text-muted-foreground text-muted-foreground/g, 'text-muted-foreground');
  content = content.replace(/bg-card text-card-foreground dark:bg-slate-900/g, 'bg-card text-card-foreground');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function traverseDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      traverseDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      processFile(fullPath);
    }
  });
}

traverseDirectory(path.join(__dirname, 'src'));
console.log('Refactoring complete.');
