import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const logoPath = path.join(root, "public/logo.png");
const iconsDir = path.join(root, "public/icons");

fs.mkdirSync(iconsDir, { recursive: true });

const sizes = [180, 192, 512];

await Promise.all(
  sizes.map(async (size) => {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(logoPath)
      .resize(size, size, {
        fit: "contain",
        background: { r: 8, g: 120, b: 255, alpha: 1 },
      })
      .png()
      .toFile(outputPath);
  }),
);

console.log(`Generated ${sizes.length} PWA icons in public/icons/`);
