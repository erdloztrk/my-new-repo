/* eslint-disable */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon seçimi: building-store (şehir rehberi için uygun)
const iconName = 'building-store';
const svgPath = path.join(__dirname, '../node_modules/@tabler/icons/icons/outline', `${iconName}.svg`);
const outputPath = path.join(__dirname, '../assets/icon.png');
const adaptiveIconPath = path.join(__dirname, '../assets/adaptive-icon.png');

// SVG içeriğini oku
const svgContent = fs.readFileSync(svgPath, 'utf8');

// SVG'yi PNG'ye çevir (1024x1024, arka plan rengi ile)
// Expo için icon: 1024x1024, şeffaf olmayan arka plan
sharp(Buffer.from(svgContent))
  .resize(1024, 1024, {
    fit: 'contain',
    background: { r: 108, g: 99, b: 255, alpha: 1 } // Primary color: #6C63FF
  })
  .png()
  .toFile(outputPath)
  .then(() => {
    console.log('✅ App icon created:', outputPath);
    
    // Adaptive icon için de oluştur (Android)
    return sharp(Buffer.from(svgContent))
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 108, g: 99, b: 255, alpha: 1 }
      })
      .png()
      .toFile(adaptiveIconPath);
  })
  .then(() => {
    console.log('✅ Adaptive icon created:', adaptiveIconPath);
  })
  .catch(err => {
    console.error('❌ Error creating icons:', err);
    process.exit(1);
  });
