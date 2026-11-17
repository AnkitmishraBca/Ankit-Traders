import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

export const A5 = {
  widthMm: 148,
  heightMm: 210,
  widthPx: 559,
  heightPx: 794,
  dpi: 300,
} as const;

export const A5_PX_300DPI = {
  width: Math.round((A5.widthMm / 25.4) * A5.dpi),
  height: Math.round((A5.heightMm / 25.4) * A5.dpi),
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
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
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

function paintCoverSquare(img: HTMLImageElement, size = 360): HTMLCanvasElement | null {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return null;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const side = Math.min(iw, ih);
  const sx = (iw - side) / 2;
  const sy = (ih - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  ctx.getImageData(0, 0, 1, 1);
  return canvas;
}

async function rasterizeImage(
  sourceImg: HTMLImageElement | undefined,
  rawSrc: string,
): Promise<HTMLCanvasElement | null> {
  if (sourceImg && sourceImg.complete && sourceImg.naturalWidth > 0) {
    try {
      const direct = paintCoverSquare(sourceImg);
      if (direct) return direct;
    } catch {
      /* fall through to fetch */
    }
  }

  if (!rawSrc || typeof window === "undefined") return null;
  const absoluteUrl =
    rawSrc.startsWith("data:") || rawSrc.startsWith("blob:") || rawSrc.startsWith("http")
      ? rawSrc
      : new URL(rawSrc, window.location.origin).href;

  try {
    const response = await fetch(absoluteUrl, { cache: "force-cache" });
    if (response.ok) {
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      try {
        const loaded = await new Promise<HTMLImageElement | null>((resolve) => {
          const el = new Image();
          const timer = setTimeout(() => resolve(null), 5000);
          el.onload = () => {
            clearTimeout(timer);
            resolve(el);
          };
          el.onerror = () => {
            clearTimeout(timer);
            resolve(null);
          };
          el.src = objectUrl;
        });
        if (loaded) {
          const painted = paintCoverSquare(loaded);
          if (painted) return painted;
        }
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }
  } catch {
    /* fall through to standard Image load */
  }

  return new Promise((resolve) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), 5000);
    el.onload = () => {
      clearTimeout(timer);
      try {
        resolve(paintCoverSquare(el));
      } catch {
        resolve(null);
      }
    };
    el.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    el.src = absoluteUrl;
  });
}

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

  const preparedCanvases = new Map<string, HTMLCanvasElement>();
  const sourceImgs = Array.from(source.querySelectorAll("img"));
  const cloneImgs = Array.from(clone.querySelectorAll("img"));

  await Promise.all(
    cloneImgs.map(async (cloneImg, idx) => {
      const sourceImg = sourceImgs[idx];
      const rawSrc =
        cloneImg.getAttribute("src") || sourceImg?.currentSrc || sourceImg?.src || "";
      const painted = await rasterizeImage(sourceImg, rawSrc);
      if (!painted) return;
      const id = String(idx);
      painted.className = cloneImg.className;
      painted.setAttribute("data-export-img", id);
      preparedCanvases.set(id, painted);
      cloneImg.replaceWith(painted);
    }),
  );

  stage.appendChild(clone);
  document.body.appendChild(stage);

  try {
    await settle(clone);

    const bounds = clone.getBoundingClientRect();
    const baseWidth = Math.max(bounds.width || A5.widthPx, 100);
    const baseHeight = Math.max(bounds.height || A5.heightPx, 100);
    const scale = baseHeight * 3 > MAX_CANVAS_SIDE ? MAX_CANVAS_SIDE / baseHeight : 3;

    const canvas = await html2canvas(clone, {
      scale,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
      imageTimeout: 15000,
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
        const clonedCanvases = Array.from(
          element.querySelectorAll<HTMLCanvasElement>("canvas[data-export-img]"),
        );
        for (const target of clonedCanvases) {
          const id = target.getAttribute("data-export-img");
          const srcCanvas = id ? preparedCanvases.get(id) : undefined;
          if (!srcCanvas) continue;
          target.width = srcCanvas.width;
          target.height = srcCanvas.height;
          const tctx = target.getContext("2d");
          if (tctx) {
            tctx.drawImage(srcCanvas, 0, 0);
          }
        }
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

export async function exportA5Jpg(source: HTMLElement, filename: string): Promise<void> {
  const canvas = flatten(await renderA5Canvas(source));
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  triggerDownload(dataUrl, filename.endsWith(".jpg") ? filename : `${filename}.jpg`);
}

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
      `<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},600);};</script>` +
      `</body></html>`,
  );
  win.document.close();
  return true;
}
