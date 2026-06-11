const fs = require('fs');
const path = require('path');

const replacements = [
  // Primary CTA buttons
  { regex: /\bbg-amber-600 hover:bg-amber-700 text-white\b/g, replacement: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
  { regex: /\bbg-amber-600 text-white\b/g, replacement: 'bg-primary text-primary-foreground' },
  { regex: /\btext-amber-600\b/g, replacement: 'text-primary' },
  { regex: /\bbg-green-500 text-white\b/g, replacement: 'bg-emerald-600 text-primary-foreground' },
  { regex: /\bbg-green-600 hover:bg-green-700 text-white\b/g, replacement: 'bg-emerald-600 hover:bg-emerald-700 text-primary-foreground' },
  
  // Specific rigid background components
  { regex: /\bbg-slate-900 text-white border-0\b/g, replacement: 'bg-card text-card-foreground border' },
  { regex: /\bbg-slate-900 text-white\b/g, replacement: 'bg-card text-card-foreground' },
  { regex: /\btext-white\b/g, replacement: 'text-primary-foreground' },
  { regex: /\btext-black\b/g, replacement: 'text-foreground' },
  { regex: /\bbg-black\b/g, replacement: 'bg-foreground' },
  { regex: /\bbg-white\b/g, replacement: 'bg-background' },
  
  // Cleanup duplicates
  { regex: /text-primary-foreground text-primary-foreground/g, replacement: 'text-primary-foreground' },
  { regex: /text-foreground text-foreground/g, replacement: 'text-foreground' },
  { regex: /dark:text-primary-foreground/g, replacement: '' }, // Because it's redundant if we use foregrounds
];

function processFile(filePath) {
  // Skip components/ui/ except if we really need to (Shadcn components use native vars)
  if (filePath.includes('src\\components\\ui') || filePath.includes('src/components/ui')) {
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

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
console.log('Final refactoring complete.');
