const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SIZES = [192, 512];

async function optimizeIcons() {
    console.log('🎨 Optimizing icons...\n');
    
    for (const size of SIZES) {
        const inputPath = path.join(ICONS_DIR, `icon-${size}.png`);
        const outputPath = path.join(ICONS_DIR, `icon-${size}.png`);
        
        if (!fs.existsSync(inputPath)) {
            console.log(`❌ Not found: icon-${size}.png`);
            continue;
        }
        
        const originalSize = fs.statSync(inputPath).size;
        
        await sharp(inputPath)
            .resize(size, size)
            .png({ 
                compressionLevel: 9,
                adaptiveFiltering: true,
                palette: true
            })
            .toFile(outputPath + '.tmp');
        
        // Rename temp file
        fs.renameSync(outputPath + '.tmp', outputPath);
        
        const newSize = fs.statSync(outputPath).size;
        const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);
        
        console.log(`✅ icon-${size}.png:`);
        console.log(`   Before: ${(originalSize / 1024).toFixed(1)} KB`);
        console.log(`   After:  ${(newSize / 1024).toFixed(1)} KB`);
        console.log(`   Reduced: ${reduction}%\n`);
    }
    
    console.log('✨ Icons optimized!');
}

optimizeIcons().catch(console.error);
