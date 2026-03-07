#!/usr/bin/env node
/**
 * assets/icon.png を中央クロップで正方形にする。
 * 実行: node scripts/crop-icon-square.mjs
 */
import sharp from "sharp";
import { renameSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const iconPath = join(root, "assets", "icon.png");
const tmpPath = join(root, "assets", "icon.png.tmp");

const meta = await sharp(iconPath).metadata();
const { width = 0, height = 0 } = meta;
const size = Math.min(width, height);
if (size === 0) {
  console.error("Could not read icon dimensions");
  process.exit(1);
}
const left = Math.floor((width - size) / 2);
const top = Math.floor((height - size) / 2);

await sharp(iconPath)
  .extract({ left, top, width: size, height: size })
  .toFile(tmpPath);
renameSync(tmpPath, iconPath);

console.log(`Cropped icon to ${size}x${size} (from ${width}x${height})`);
