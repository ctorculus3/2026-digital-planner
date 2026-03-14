import html2canvas from "html2canvas";

export type ExportFormat = "instagram" | "twitter" | "square" | "default";

const FORMAT_DIMENSIONS: Record<ExportFormat, { width: number; height: number }> = {
  instagram: { width: 540, height: 960 },   // 1080x1920 at scale 2
  twitter: { width: 600, height: 338 },      // 1200x675 at scale 2
  square: { width: 540, height: 540 },       // 1080x1080 at scale 2
  default: { width: 600, height: 800 },      // general purpose
};

/**
 * Render a DOM element as a PNG blob using html2canvas.
 * The element should be a WeeklyReportCard with forExport={true}.
 */
export async function exportReportAsImage(
  element: HTMLElement,
  format: ExportFormat = "default"
): Promise<Blob> {
  const dims = FORMAT_DIMENSIONS[format];

  // Temporarily set fixed dimensions for capture
  const originalStyle = element.style.cssText;
  element.style.width = `${dims.width}px`;
  element.style.minHeight = `${dims.height}px`;
  element.style.position = "absolute";
  element.style.left = "-9999px";
  element.style.top = "0";

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: dims.width,
      height: Math.max(dims.height, element.scrollHeight),
      logging: false,
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create image blob"));
        },
        "image/png",
        1.0
      );
    });
  } finally {
    element.style.cssText = originalStyle;
  }
}

/**
 * Trigger a browser download of a blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
