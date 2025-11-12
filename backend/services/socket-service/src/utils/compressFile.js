import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function compressImage(sourcePath) {
    const srcDir = process.cwd();// or path.join(__dirname, '..')
    const outputDir = path.join(srcDir, 'compressed'); // store in src/images
    console.log('====================================');
    console.log({ srcDir, outputDir });
    console.log('====================================');

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const fileName = path.basename(sourcePath);
    const outputPath = path.join(outputDir, fileName);

    await sharp(sourcePath)
        .resize({ width: 800 }) // resize width to 800px (keep aspect ratio)
        .jpeg({ quality: 70 })  // compress quality
        .toFile(outputPath);

    console.log(`✅ Compressed image saved at: ${outputPath}`);
    return outputPath;
}

export { compressImage };