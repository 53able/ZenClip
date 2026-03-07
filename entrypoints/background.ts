/**
 * ZenClip の Service Worker。
 * 拡張アイコンクリックで現在タブに「本文をクリップ」を依頼し、結果をバッジで表示する。
 */

import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

type ClipResult =
  | { ok: true; length: number }
  | { ok: false; error: string };

const BADGE_DURATION_MS = 2000;

export default defineBackground(() => {
  browser.action.onClicked.addListener((tab) => {
    if (tab.id === undefined) return;

    const showBadge = (result: ClipResult) => {
      if (result.ok && typeof result.length === "number") {
        const short =
          result.length >= 1000
            ? `${(result.length / 1000).toFixed(1)}k`
            : String(result.length);
        browser.action.setBadgeText({ tabId: tab.id!, text: short });
        browser.action.setBadgeBackgroundColor({
          tabId: tab.id!,
          color: "#0a0",
        });
      } else if (!result.ok) {
        browser.action.setBadgeText({ tabId: tab.id!, text: "!" });
        browser.action.setBadgeBackgroundColor({
          tabId: tab.id!,
          color: "#c00",
        });
      }
      setTimeout(() => {
        browser.action.setBadgeText({ tabId: tab.id!, text: "" });
      }, BADGE_DURATION_MS);
    };

    const sendClipMessage = (): Promise<ClipResult | undefined> =>
      browser.tabs.sendMessage(tab.id!, { type: "zenclip-clip" });

    sendClipMessage()
      .then((result: ClipResult | undefined) => {
        if (result) showBadge(result);
      })
      .catch((err) => {
        const isNoReceiver =
          err instanceof Error &&
          (err.message.includes("Receiving end does not exist") ||
            err.message.includes("Could not establish connection"));
        if (isNoReceiver) {
          browser.scripting
            .executeScript({
              target: { tabId: tab.id! },
              files: ["/content-scripts/content.js"],
            })
            .then(() => sendClipMessage())
            .then((result) => {
              if (result) showBadge(result);
            })
            .catch(() => {
              // 注入できないページ（chrome:// 等）は無視
            });
        }
      });
  });
});
