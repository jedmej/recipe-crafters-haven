import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [192, 512];
const inputImage = path.join(process.cwd(), 'public', 'og-image.png');
const outputDir = path.join(process.cwd(), 'public');

async function generateIcons() {
  try {
    for (const size of sizes) {
      await sharp(inputImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toFile(path.join(outputDir, `pwa-${size}x${size}.png`));
      
      console.log(`Generated ${size}x${size} icon`);
    }
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 