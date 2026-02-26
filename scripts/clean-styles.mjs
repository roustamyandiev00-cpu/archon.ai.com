import fs from 'fs';
import path from 'path';

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;

      // Replace common excessive transparent blur classes with solid crisp SaaS styles
      content = content.replace(/bg-card\/[0-9]+/g, 'bg-card shadow-sm');
      content = content.replace(/backdrop-blur-xl/g, '');
      content = content.replace(/backdrop-blur-md/g, '');
      content = content.replace(/border-border\/30/g, 'border-border/50');
      content = content.replace(/border-border\/40/g, 'border-border/50');
      content = content.replace(/bg-background\/[0-9]+/g, 'bg-background');
      content = content.replace(/bg-muted\/[0-9]+/g, 'bg-muted');

      // Clean up multiple spaces that might result from replacing with empty string
      content = content.replace(/ +/g, ' ');
      content = content.replace(/' /g, "'");
      content = content.replace(/" /g, '"');
      content = content.replace(/ '/g, "'");
      content = content.replace(/ "/g, '"');
      content = content.replace(/ ` /g, '`');
      content = content.replace(/`/g, '`');
      content = content.replace(/ className=" /g, ' className="');
      content = content.replace(/ className=' /g, " className='");

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(process.cwd(), 'src'));
console.log('Cleanup complete.');
