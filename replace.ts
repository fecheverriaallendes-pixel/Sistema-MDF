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
  
  // Replace Name
  content = content.replace(/FARDOS AARON/g, 'El Garage del Fardo');
  content = content.replace(/FARDOS <span className="text-blue-600 italic">AARON<\/span>/g, 'El Garage <span className="text-amber-600 italic">del Fardo</span>');
  content = content.replace(/FARDOS <span className="text-blue-400 italic">AARON<\/span>/g, 'El Garage <span className="text-amber-400 italic">del Fardo</span>');
  
  // Replace Logo
  content = content.replace(/https:\/\/i\.ibb\.co\/qMyZQHYg\/logo-sin-fondo-1\.png/g, 'https://i.ibb.co/qMSczKZF/Whats-App-Image-2026-04-13-at-12-23-21.jpg');
  
  // Replace Colors
  content = content.replace(/blue-/g, 'amber-');
  
  fs.writeFileSync(file, content, 'utf8');
});

console.log('Replacements complete.');
