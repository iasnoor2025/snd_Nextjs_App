import type { jsPDF } from 'jspdf';

export const ARABIC_FONT_FILE = 'NotoSansArabic-Regular.ttf';
export const ARABIC_FONT_NAME = 'NotoSansArabic';

let fontBase64Cache: string | null = null;
let fontLoadPromise: Promise<string | null> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    let chunkStr = '';
    for (let j = 0; j < chunk.length; j++) {
      chunkStr += String.fromCharCode(chunk[j]);
    }
    binary += chunkStr;
  }
  return btoa(binary);
}

/** Load Noto Sans Arabic from `/fonts/NotoSansArabic-Regular.ttf` (same as supervisor equipment PDF). */
export async function loadArabicFontDataForPdf(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (fontBase64Cache) return fontBase64Cache;
  if (fontLoadPromise) return fontLoadPromise;

  const localUrl = new URL(`/fonts/${ARABIC_FONT_FILE}`, window.location.origin).toString();
  const cdnUrl =
    'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansArabic/NotoSansArabic-Regular.ttf';

  const loadOnce = async (): Promise<string | null> => {
    try {
      let res = await fetch(localUrl);
      if (!res.ok) throw new Error('local missing');
      const buf = await res.arrayBuffer();
      const base64 = arrayBufferToBase64(buf);
      fontBase64Cache = base64;
      return base64;
    } catch {
      try {
        const res = await fetch(cdnUrl);
        if (!res.ok) throw new Error('cdn failed');
        const buf = await res.arrayBuffer();
        const base64 = arrayBufferToBase64(buf);
        fontBase64Cache = base64;
        return base64;
      } catch (error) {
        console.error('[pdf-arabic-font] Failed to load Arabic font (local + CDN):', error);
        return null;
      }
    } finally {
      fontLoadPromise = null;
    }
  };

  fontLoadPromise = loadOnce();
  return fontLoadPromise;
}

/**
 * Register Noto Sans Arabic on the document (required before drawing Arabic).
 * @param setActiveIfRegistered - if false, leaves current font (use Helvetica as default for Latin labels).
 */
export function applyArabicFontToPdf(doc: jsPDF, fontData: string, setActiveIfRegistered = true): void {
  if (!fontData || fontData.length === 0) return;
  const docAny = doc as unknown as { __arabicFontApplied?: boolean };
  if (docAny.__arabicFontApplied) {
    if (setActiveIfRegistered) {
      doc.setFont(ARABIC_FONT_NAME, 'normal');
    }
    return;
  }
  doc.addFileToVFS(ARABIC_FONT_FILE, fontData);
  doc.addFont(ARABIC_FONT_FILE, ARABIC_FONT_NAME, 'normal');
  docAny.__arabicFontApplied = true;
  if (setActiveIfRegistered) {
    doc.setFont(ARABIC_FONT_NAME, 'normal');
  }
}

export function textContainsArabic(text: string | null | undefined): boolean {
  if (text == null || text === '') return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}
