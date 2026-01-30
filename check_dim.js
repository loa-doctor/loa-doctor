
const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/Steve/.gemini/antigravity/brain/8b627889-02ea-475f-bdea-7794bf31dc27/uploaded_media_1769765567365.png';

try {
    const buffer = fs.readFileSync(filePath);
    // PNG Header: width is at offset 16 (4 bytes), height at 20 (4 bytes)
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    console.log(`Dimensions: ${width}x${height}`);
} catch (e) {
    console.error(e);
}
