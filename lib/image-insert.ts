export interface LoadedImage {
  url: string;
  width: number;
  height: number;
}

const MAX_DIM = 1600; // downscale huge images to keep storage payloads small

/** Read a File into a (possibly downscaled) data-URL + natural dimensions. */
export function readImageFile(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const scale = Math.min(1, MAX_DIM / Math.max(w, h));
        if (scale >= 1) {
          resolve({ url: src, width: w, height: h });
          return;
        }
        const cw = Math.round(w * scale);
        const ch = Math.round(h * scale);
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ url: src, width: w, height: h });
          return;
        }
        ctx.drawImage(img, 0, 0, cw, ch);
        const isPng = file.type === "image/png";
        const url = canvas.toDataURL(
          isPng ? "image/png" : "image/jpeg",
          isPng ? undefined : 0.85
        );
        resolve({ url, width: cw, height: ch });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

/** Open a file picker and resolve the chosen image (or null if cancelled). */
export function pickImageFile(): Promise<LoadedImage | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      readImageFile(file).then(resolve).catch(() => resolve(null));
    };
    input.click();
  });
}

/** A centred bounding box for an image, scaled to fit a max on-canvas size. */
export function imageBounds(
  img: LoadedImage,
  center: { x: number; y: number },
  maxOnCanvas = 420
) {
  const scale = Math.min(1, maxOnCanvas / Math.max(img.width, img.height));
  const width = img.width * scale;
  const height = img.height * scale;
  return { x: center.x - width / 2, y: center.y - height / 2, width, height };
}
