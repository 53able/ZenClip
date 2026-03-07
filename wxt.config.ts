import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "wxt";

const toAsciiOnly = (s: string) =>
  s.replace(/[\u0080-\uFFFF]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));

export default defineConfig({
  modules: ["@wxt-dev/auto-icons"],
  outDir: ".output/zen-clip",
  outDirTemplate: ".",
  hooks: {
    "build:done": (wxt, _output) => {
      const outDir = wxt.config.outDir.startsWith("/") ? wxt.config.outDir : join(wxt.config.root, wxt.config.outDir);
      const contentPath = join(outDir, "content-scripts/content.js");
      try {
        const code = readFileSync(contentPath, "utf-8");
        writeFileSync(contentPath, toAsciiOnly(code), "utf-8");
      } catch {
        // content script が無い構成なら無視
      }
    },
  },
  manifest: {
    name: "ZenClip",
    description: "Defuddle で本文だけ抽出してクリップボードにコピー",
    permissions: ["activeTab", "scripting", "clipboardWrite"],
    action: {
      default_title: "本文をクリップボードにコピー",
    },
  },
});
