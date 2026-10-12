const sharp = require('sharp');
const path = require('path');

const p1 = 'C:/Users/Asus/.gemini/antigravity/brain/e8313dbd-9593-4e08-bf7a-4c324db4c9f5/brew_bari_concept1_1791811635743.jpg';
const p3 = 'C:/Users/Asus/.gemini/antigravity/brain/e8313dbd-9593-4e08-bf7a-4c324db4c9f5/brew_bari_concept3_1791811665528.jpg';

async function main() {
  // 1. Full Concept 1
  await sharp(p1)
    .resize(800, 800)
    .webp({ quality: 90 })
    .toFile('public/images/brand/concept-1.webp');
  console.log('Saved concept-1.webp');

  // 2. Full Concept 3
  await sharp(p3)
    .resize(800, 800)
    .webp({ quality: 90 })
    .toFile('public/images/brand/concept-3.webp');
  console.log('Saved concept-3.webp');

  // 3. Isolated transparent circular logo from Concept 3
  const circleSvg = Buffer.from(
    '<svg width="500" height="500" viewBox="0 0 500 500"><circle cx="250" cy="250" r="248" fill="#fff"/></svg>'
  );

  const cropped500 = await sharp(p3)
    .extract({ left: 90, top: 91, width: 852, height: 852 })
    .resize(500, 500)
    .png()
    .toBuffer();

  await sharp(cropped500)
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .webp({ quality: 95, alphaQuality: 100 })
    .toFile('public/images/brand/logo.webp');
  console.log('Saved logo.webp (circular transparent)');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
