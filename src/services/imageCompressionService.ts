/**
 * Image Compression Service for SubliStock Pro
 * Optimizes base64 images (logos, designs, item photos) to guarantee high visual quality
 * while keeping document sizes well below the Google Cloud Firestore 1MB (1,048,576 bytes) limit.
 */

export class ImageCompressionService {
  /**
   * Compresses a Base64 data URL to given maximum dimension and JPEG/PNG quality.
   */
  static compressImageBase64(
    dataUrl: string,
    maxDim: number = 450,
    quality: number = 0.82
  ): Promise<string> {
    return new Promise((resolve) => {
      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
        return resolve(dataUrl);
      }

      // If it's already tiny (< 80 KB), keep as is
      if (dataUrl.length < 80 * 1024) {
        return resolve(dataUrl);
      }

      // In browser environment with Image and Canvas
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return resolve(dataUrl);
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          let { width, height } = img;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            return resolve(dataUrl);
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Check if transparency is needed (PNG)
          const isPng = dataUrl.startsWith('data:image/png');
          
          let compressed: string;
          if (isPng) {
            compressed = canvas.toDataURL('image/png');
            // If PNG is still larger than 200 KB, convert to web-optimized JPEG with white background
            if (compressed.length > 200 * 1024) {
              const bgCanvas = document.createElement('canvas');
              bgCanvas.width = width;
              bgCanvas.height = height;
              const bgCtx = bgCanvas.getContext('2d');
              if (bgCtx) {
                bgCtx.fillStyle = '#ffffff';
                bgCtx.fillRect(0, 0, width, height);
                bgCtx.drawImage(canvas, 0, 0);
                const jpegOutput = bgCanvas.toDataURL('image/jpeg', quality);
                compressed = jpegOutput.length < compressed.length ? jpegOutput : compressed;
              }
            }
          } else {
            compressed = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
        } catch (e) {
          console.warn('ImageCompressionService: Error compressing on canvas:', e);
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        resolve(dataUrl);
      };

      img.src = dataUrl;
    });
  }

  /**
   * Compresses an uploaded File directly to an optimized base64 data URL.
   */
  static compressFileToDataUrl(
    file: File,
    maxDim: number = 450,
    quality: number = 0.82
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const rawDataUrl = reader.result as string;
          const compressed = await this.compressImageBase64(rawDataUrl, maxDim, quality);
          resolve(compressed);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Recursively sanitizes and compresses any base64 images inside an object
   * (such as quotation design images or logoUrl) to ensure the document never exceeds Firestore limits.
   */
  static async sanitizeObjectImages<T>(data: T, maxDim: number = 450): Promise<T> {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      const mapped = await Promise.all(data.map(item => this.sanitizeObjectImages(item, maxDim)));
      return mapped as unknown as T;
    }

    const copy: any = { ...data };
    for (const key of Object.keys(copy)) {
      const val = copy[key];
      if (typeof val === 'string' && val.startsWith('data:image/') && val.length > 80 * 1024) {
        copy[key] = await this.compressImageBase64(val, maxDim, 0.8);
      } else if (typeof val === 'object' && val !== null) {
        copy[key] = await this.sanitizeObjectImages(val, maxDim);
      }
    }
    return copy;
  }
}
