const sharp = require('sharp');

async function resizeIcons() {
  try {
    const sizes = [192, 512, 144, 384];
    for (const size of sizes) {
      await sharp('public/logo.png')
        .resize(size, size)
        .toFile(`public/icons/icon-${size}x${size}.png`);
      console.log(`Created icon-${size}x${size}.png`);
    }
  } catch (error) {
    console.error('Error resizing images:', error);
  }
}

resizeIcons();
