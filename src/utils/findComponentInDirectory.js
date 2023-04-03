import fs from 'fs';
import path from 'path';

export const findComponentInDirectory = (basePath, fileName) => {
    const files = fs.readdirSync(basePath);
  
    for (const file of files) {
      const filePath = path.join(basePath, file);
      const stats = fs.statSync(filePath);
  
      if (stats.isDirectory()) {
        const foundFile = findComponentInDirectory(filePath, fileName);
        if (foundFile) {
          return foundFile;
        }
      } else if (stats.isFile() && file === fileName) {
        return `~/components${filePath.split('\\').join('/').split('/components')[1]}`;
      }
    }
  
    return null;
}