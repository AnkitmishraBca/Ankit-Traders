import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

/**
 * A5 export engine — Ankit Traders
 * ---------------------------------------------------------------------------
 * Every invoice / market-collection sheet is exported at EXACT A5 size
 * (148mm x 210mm) and rendered at 300 DPI so the print, PDF and JPG output is
 * sharp (text is never faded / blurry), on screen as well as on paper.
 */

export const A5 = {
  widthMm: 148,
  heightMm: 210,
  widthPx: 559, // 148mm @96dpi
  heightPx: 794, // 210mm @96dpi
  dpi: 300,
} as const;

export const A5_PX_300DPI = {
  width: Math.round((A5.widthMm / 25.4) * A5.dpi), // 1748
  height: Math.round((A5.heightMm / 25.4) * A5.dpi), // 2480
};

const MAX_CANVAS_SIDE = 8000;
const JPEG_QUALITY = 0.96;

async function settle(root?: HTMLElement | null) {
  try {
    if (typeof document !== "undefined" && "fonts" in document) {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    }
  } catch {
    /* font loading is best-effort */
  }
  if (root) await decodeImages(root);
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  await new Promise((resolve) => setTimeout(resolve, 90));
}

async function decodeImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(async (img) => {
      if (img.complete && img.naturalWidth > 0) return;
      try {
        await img.decode();
      } catch {
        await new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          setTimeout(() => resolve(false), 2500);
        });
      }
    }),
  );
}

/**
 * Renders any memo node into a 300 DPI canvas with an exact A5 width.
 * The node is cloned into an off-screen stage that is 148mm wide, so the
 * output never depends on the visitor's screen size.
 */
export async function renderA5Canvas(source: HTMLElement): Promise<HTMLCanvasElement> {
  if (!source) throw new Error("Nothing to export yet");

  const stage = document.createElement("div");
  stage.className = "export-stage";
  stage.setAttribute("aria-hidden", "true");

  const clone = source.cloneNode(true) as HTMLElement;
  clone.classList.add("a5-paper");
  clone.removeAttribute("style");
  clone.style.width = "148mm";
  clone.style.minHeight = "210mm";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";
  clone.style.transform = "none";
  clone.style.opacity = "1";
  clone.style.visibility = "visible";
  clone.style.position = "static";

  stage.appendChild(clone);
  document.body.appendChild(stage);

  try {
    await settle(clone);

    const bounds = clone.getBoundingClientRect();
    const baseWidth = Math.max(bounds.width || A5.widthPx, 100);
    const baseHeight = Math.max(bounds.height || A5.heightPx, 100);

    // High quality export: html2canvas scale 3 (≈300 DPI on A5).
    const scale = baseHeight * 3 > MAX_CANVAS_SIDE ? MAX_CANVAS_SIDE / baseHeight : 3;

    const canvas = await html2canvas(clone, {
      scale,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
      imageTimeout: 0,
      imageSmoothing: true,
      imageSmoothingQuality: "high",
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      width: baseWidth,
      height: baseHeight,
      windowWidth: Math.ceil(baseWidth) + 2,
      windowHeight: Math.ceil(baseHeight) + 2,
      onclone: (_doc, element) => {
        element.style.transform = "none";
        element.style.boxShadow = "none";
      },
    });

    return canvas;
  } finally {
    stage.remove();
  }
}

function flatten(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0);
  }
  return out;
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** A5 PDF (300 DPI). Long sheets automatically continue on extra A5 pages. */
export async function exportA5Pdf(source: HTMLElement, filename: string): Promise<void> {
  const canvas = flatten(await renderA5Canvas(source));
  const pageHeightPx = Math.round((canvas.width / A5.widthMm) * A5.heightMm);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5",
    compress: true,
    putOnlyUsedFonts: true,
  });

  let offsetY = 0;
  let pageIndex = 0;
  while (offsetY < canvas.height && pageIndex < 24) {
    const sliceHeight = Math.min(pageHeightPx, canvas.height - offsetY);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;
    const ctx = pageCanvas.getContext("2d");
    if (!ctx) break;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, offsetY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

    const image = pageCanvas.toDataURL("image/jpeg", JPEG_QUALITY);
    if (pageIndex > 0) pdf.addPage("a5", "portrait");
    const heightMm = (sliceHeight / canvas.width) * A5.widthMm;
    pdf.addImage(image, "JPEG", 0, 0, A5.widthMm, heightMm, undefined, "FAST");

    offsetY += sliceHeight;
    pageIndex += 1;
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

/** A5 JPG (300 DPI = 1748px wide) — crisp, never faded. */
export async function exportA5Jpg(source: HTMLElement, filename: string): Promise<void> {
  const canvas = flatten(await renderA5Canvas(source));
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  triggerDownload(dataUrl, filename.endsWith(".jpg") ? filename : `${filename}.jpg`);
}

/**
 * Prints the on-page A5 print sheet (`.print-only-sheet`).
 * `@page { size: A5 portrait; margin: 0 }` (see a5-print.css) makes the browser
 * pick A5 paper with borderless output and keeps all colours solid.
 */
export async function printA5Sheet(title: string): Promise<void> {
  const sheet = document.querySelector<HTMLElement>(".print-only-sheet");
  if (!sheet || !sheet.innerHTML.trim()) throw new Error("Sheet is not ready yet");

  sheet.removeAttribute("aria-hidden");
  document.body.classList.add("printing-now");
  await settle(sheet);
  await new Promise((resolve) => setTimeout(resolve, 140));

  const cleanup = () => {
    document.body.classList.remove("printing-now");
    sheet.setAttribute("aria-hidden", "true");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);

  const previousTitle = document.title;
  document.title = title;

  try {
    if (typeof window.print === "function") {
      window.focus();
      window.print();
    } else {
      printViaPopup(sheet, title);
    }
  } catch {
    printViaPopup(sheet, title);
  } finally {
    setTimeout(() => {
      document.title = previousTitle;
      cleanup();
    }, 1200);
  }
}

/** Fallback for browsers that block window.print() (older iOS / in-app browsers). */
function printViaPopup(sheet: HTMLElement, title: string): boolean {
  const win = window.open("", "_blank", "width=820,height=980");
  if (!win) return false;
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join("\n");
  win.document.open();
  win.document.write(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" />` +
      `<meta name="viewport" content="width=device-width, initial-scale=1" />` +
      `<title>${title}</title>${styles}` +
      `<style>@page{size:A5 portrait;margin:0}html,body{margin:0!important;padding:0!important;background:#fff!important;width:148mm}` +
      `body *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}` +
      `.app-shell,.modal-backdrop,.toast,.export-stage{display:none!important}` +
      `.print-only-sheet{display:block!important;width:148mm!important;max-width:148mm!important;margin:0!important;padding:0!important}` +
      `.print-only-sheet .invoice-paper{width:148mm!important;min-height:210mm;border:0!important;box-shadow:none!important;border-radius:0!important}` +
      `</style></head><body><div class="print-only-sheet">${sheet.innerHTML}</div>` +
      `<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},600);};<\/script>` +
      `</body></html>`,
  );
  win.document.close();
  return true;
}
