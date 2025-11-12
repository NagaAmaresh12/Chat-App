import path from 'path'
const imagePath = path.resolve();
const sourcePath = path.join(imagePath, 'images', 'download.jpeg')
const fileName = path.basename(sourcePath);
const outputPath = path.join(imagePath, 'compressed', fileName);
console.log('====================================');
console.log({ imagePath, sourcePath, fileName, outputPath });
console.log('====================================');