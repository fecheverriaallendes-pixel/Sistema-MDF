import fs from 'fs';
import path from 'path';

const walkSync = (dir: string, filelist: string[] = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'OENT' || err.code === 'EACCES') {
        // Ignore
      } else {
        throw err;
      }
    }
  });
  return filelist;
};

const files = walkSync('./src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/FA-/g, 'GF-');
  
  fs.writeFileSync(file, content, 'utf8');
});

console.log('Replacements complete.');
