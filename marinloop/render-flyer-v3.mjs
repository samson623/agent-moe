import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const HTML_PATH = resolve('marinloop/marinloop-beta-flyer-v3.html');
const OUT_PNG   = resolve('marinloop/flyer-v3-300dpi.png');
const OUT_PDF   = resolve('marinloop/MarinLoop-Beta-Flyer-v3.pdf');

async function render() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    deviceScaleFactor: 4,          // 4x = 300+ DPI for 8.5x11 at 816x1056 CSS pixels
    viewport: { width: 816, height: 1056 },
  });
  const page = await context.newPage();
  await page.goto(`file://${HTML_PATH}`, { waitUntil: 'networkidle' });

  // Wait for fonts to load
  await page.waitForTimeout(2000);

  // Screenshot at 4x = 3264x4224 pixels (300+ DPI for 8.5x11)
  const pngBuffer = await page.screenshot({
    type: 'png',
    fullPage: false,
    clip: { x: 0, y: 0, width: 816, height: 1056 },
  });

  // Inject pHYs chunk for 300 DPI (11811 pixels per meter)
  const pngWithDpi = injectPHYs(pngBuffer, 11811);
  writeFileSync(OUT_PNG, pngWithDpi);
  console.log(`PNG saved: ${OUT_PNG} (${pngWithDpi.length} bytes, 300+ DPI)`);

  // Also generate PDF
  await page.pdf({
    path: OUT_PDF,
    width: '8.5in',
    height: '11in',
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    printBackground: true,
    preferCSSPageSize: true,
  });
  console.log(`PDF saved: ${OUT_PDF}`);

  await browser.close();
}

/**
 * Inject pHYs chunk into PNG buffer for print DPI metadata.
 * pHYs chunk: 4 bytes X pixels/unit + 4 bytes Y pixels/unit + 1 byte unit (1 = meter)
 */
function injectPHYs(pngBuffer, pixelsPerMeter) {
  const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // Find the end of IHDR chunk (signature=8 bytes, then IHDR chunk)
  // IHDR chunk: 4 bytes length + 4 bytes "IHDR" + 13 bytes data + 4 bytes CRC = 25 bytes
  const ihdrEnd = 8 + 25; // offset right after IHDR

  // Build pHYs chunk
  const phys = Buffer.alloc(9);
  phys.writeUInt32BE(pixelsPerMeter, 0); // X pixels per unit
  phys.writeUInt32BE(pixelsPerMeter, 4); // Y pixels per unit
  phys.writeUInt8(1, 8); // unit = meter

  const physType = Buffer.from('pHYs');
  const physLen = Buffer.alloc(4);
  physLen.writeUInt32BE(9, 0);

  // CRC32 over type+data
  const crcData = Buffer.concat([physType, phys]);
  const crc = crc32(crcData);
  const physCrc = Buffer.alloc(4);
  physCrc.writeUInt32BE(crc, 0);

  const physChunk = Buffer.concat([physLen, physType, phys, physCrc]);

  // Insert after IHDR
  const before = pngBuffer.subarray(0, ihdrEnd);
  const after  = pngBuffer.subarray(ihdrEnd);

  return Buffer.concat([before, physChunk, after]);
}

/** CRC32 for PNG chunks */
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

render().catch(err => { console.error(err); process.exit(1); });
