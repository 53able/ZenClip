/**
 * 現在ページの DOM を Defuddle でパースし、本文をクリップボードにコピーする。
 * 成功・失敗時にページ内トーストでフィードバックする。
 */

import { browser, type Browser } from "wxt/browser";
import { defineContentScript } from "wxt/utils/define-content-script";
import Defuddle from "defuddle";

const TOAST_DURATION_MS = 2500;

/**
 * ページ内にトーストを表示し、指定時間後に消す。
 * @param message - 表示する文言
 * @param isError - エラー用スタイル（赤系）にするか
 */
const showToast = (message: string, isError: boolean = false): void => {
  const el = document.createElement("div");
  el.setAttribute("data-zenclip-toast", "1");
  Object.assign(el.style, {
    position: "fixed",
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#fff",
    backgroundColor: isError ? "#c00" : "#0a0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    zIndex: "2147483647",
    fontFamily: "system-ui, sans-serif",
    pointerEvents: "none",
    maxWidth: "90vw",
    wordBreak: "break-word",
  });
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), TOAST_DURATION_MS);
};

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  main() {
    /** HTML 文字列からプレーンテキストを取得する。 */
    const htmlToPlainText = (html: string): string => {
      const div = document.createElement("div");
      div.innerHTML = html;
      return (div.textContent ?? "").trim();
    };

    /** クリップボードに書き、成功したら true。 */
    const copyToClipboard = (text: string): Promise<boolean> =>
      navigator.clipboard.writeText(text).then(() => true).catch(() => false);

    /** 本文を抽出してクリップボードにコピーする。 */
    const clipPageContent = async (): Promise<
      { ok: true; length: number } | { ok: false; error: string }
    > => {
      try {
        const defuddle = new Defuddle(document);
        const result = defuddle.parse();
        const content = result?.content;
        if (typeof content !== "string" || content.length === 0) {
          return { ok: false, error: "本文が取得できませんでした" };
        }

        const plain = htmlToPlainText(content);
        if (plain.length === 0) {
          return { ok: false, error: "本文が空でした" };
        }

        const copied = await copyToClipboard(plain);
        if (!copied) {
          return { ok: false, error: "クリップボードに書き込めませんでした" };
        }

        return { ok: true, length: plain.length };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { ok: false, error: message };
      }
    };

    browser.runtime.onMessage.addListener(
      (
        message: { type?: string },
        _sender: Browser.runtime.MessageSender,
        sendResponse: (response: unknown) => void
      ) => {
        if (message.type !== "zenclip-clip") return;

        clipPageContent()
          .then((result) => {
            if (result.ok) {
              showToast(`コピーしました（${result.length} 文字）`, false);
            } else {
              showToast(result.error, true);
            }
            sendResponse(result);
          })
          .catch((e) => {
            sendResponse({ ok: false, error: String(e) });
          });
        return true; // 非同期で sendResponse するため
      }
    );
  },
});
