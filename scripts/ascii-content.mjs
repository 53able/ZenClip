#!/usr/bin/env node
/**
 * content-scripts/content.js を ASCII のみに変換する。
 * Chrome 拡張の「UTF-8 でエンコードされていません」を防ぐ。
 * 実行: node scripts/ascii-content.mjs（build スクリプトから呼ばれる）
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const contentPath = join(root, ".output", "zen-clip", "content-scripts", "content.js");

const toAsciiOnly = (s) =>
  s.replace(/[\u0080-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));

try {
  const code = readFileSync(contentPath, "utf-8");
  writeFileSync(contentPath, toAsciiOnly(code), "utf-8");
} catch (e) {
  console.warn("ascii-content: skip", e.message);
}
