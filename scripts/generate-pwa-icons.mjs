import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const logoPath = path.join(root, "public/logo.png");
const iconsDir = path.join(root, "public/icons");

fs.mkdirSync(iconsDir, { recursive: true });

/** Fraction of the canvas the logo should fill (rest is margin). */
const FILL = 0.98;
const BG = { r: 0, g: 0, b: 0, alpha: 1 };

/**
 * Crop near-black padding so the blue circle fills the icon.
 */
async function extractLogoContent() {
  const { data, info } = await sharp(logoPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h, channels: c } = info;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * c;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a > 10 && (r > 20 || g > 20 || b > 20)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const contentW = maxX - minX + 1;
  const contentH = maxY - minY + 1;
  const side = Math.max(contentW, contentH);
  const pad = Math.ceil(side * 0.02);
  const left = Math.max(0, Math.floor(minX - (side - contentW) / 2) - pad);
  const top = Math.max(0, Math.floor(minY - (side - contentH) / 2) - pad);
  const extractSide = Math.min(w - left, h - top, side + pad * 2);

  return sharp(logoPath).extract({
    left,
    top,
    width: extractSide,
    height: extractSide,
  });
}

const sizes = [32, 180, 192, 512];
const cropped = await extractLogoContent();
const croppedBuffer = await cropped.png().toBuffer();

await Promise.all(
  sizes.map(async (size) => {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    const logoSize = Math.round(size * FILL);
    const offset = Math.round((size - logoSize) / 2);

    const logo = await sharp(croppedBuffer)
      .resize(logoSize, logoSize, { fit: "contain", background: BG })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BG,
      },
    })
      .composite([{ input: logo, left: offset, top: offset }])
      .png()
      .toFile(outputPath);
  }),
);

console.log(`Generated ${sizes.length} PWA icons in public/icons/`);
