/**
 * Compress and resize an image file using an off-screen canvas.
 *
 * @param {File} file          – The original File/Blob from an <input>.
 * @param {Object} [opts]
 * @param {number} [opts.maxWidth=1200]   – Max pixel width (aspect ratio preserved).
 * @param {number} [opts.maxHeight=1200]  – Max pixel height.
 * @param {number} [opts.quality=0.8]     – JPEG quality (0–1).
 * @param {string} [opts.type='image/jpeg'] – Output MIME type.
 * @returns {Promise<File>}  A new compressed File with the same name.
 */
export default function compressImage(
  file,
  { maxWidth = 1200, maxHeight = 1200, quality = 0.8, type = 'image/jpeg' } = {},
) {
  // Skip non-image files (PDFs, etc.)
  if (!file.type.startsWith('image/')) return Promise.resolve(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Only downscale — never upscale
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; } // fallback to original
          // If compressed is actually larger, keep original
          if (blob.size >= file.size) { resolve(file); return; }
          const compressed = new File([blob], file.name, {
            type: blob.type,
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        type,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback — don't break the upload
    };

    img.src = url;
  });
}

/**
 * Generate a small thumbnail blob URL for card previews.
 * Much smaller than the full image → loads instantly in grids.
 *
 * @param {File} file
 * @param {number} [size=300] – Max width/height for thumbnail.
 * @returns {Promise<string>} A blob: URL for the thumbnail.
 */
export function createThumbnailURL(file, size = 300) {
  if (!file.type.startsWith('image/')) return Promise.resolve(null);

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > size || height > size) {
        const ratio = Math.min(size / width, size / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(blob ? URL.createObjectURL(blob) : URL.createObjectURL(file));
        },
        'image/jpeg',
        0.6,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(URL.createObjectURL(file));
    };

    img.src = url;
  });
}
