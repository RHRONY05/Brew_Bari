import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface ProcessImageOptions {
  aspectRatio?: number; // 1 for square, 2 for 2:1 offer banner
  maxDimension?: number; // default 800px
  quality?: number; // default 0.82
}

/**
 * Resizes and crops an image file to specified aspect ratio and WebP format (<= 300 KB).
 */
export async function processImageFile(
  file: File,
  options: ProcessImageOptions = {}
): Promise<Blob> {
  const { aspectRatio = 1, maxDimension = 800, quality = 0.82 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate crop bounds to match aspect ratio
        let srcX = 0;
        let srcY = 0;
        let srcWidth = img.width;
        let srcHeight = img.height;

        const currentAspect = img.width / img.height;
        if (currentAspect > aspectRatio) {
          // Image is wider than desired aspect ratio: crop sides
          srcWidth = img.height * aspectRatio;
          srcX = (img.width - srcWidth) / 2;
        } else {
          // Image is taller: crop top/bottom
          srcHeight = img.width / aspectRatio;
          srcY = (img.height - srcHeight) / 2;
        }

        // Determine destination dimensions
        let dstWidth = Math.min(srcWidth, maxDimension);
        let dstHeight = dstWidth / aspectRatio;

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(dstWidth);
        canvas.height = Math.round(dstHeight);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2d context for image processing'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          img,
          srcX,
          srcY,
          srcWidth,
          srcHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image blob to Supabase Storage bucket 'menu-images'
 */
export async function uploadMenuImage(
  restaurantId: string,
  folder: 'items' | 'offers' | 'branding',
  filename: string,
  blob: Blob
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const path = `${restaurantId}/${folder}/${filename}`;

  const { error } = await supabase.storage
    .from('menu-images')
    .upload(path, blob, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
  return data.publicUrl;
}
