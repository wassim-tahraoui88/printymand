/** Largest artwork accepted by any upload form (1 MB). */
export const MAX_ARTWORK_BYTES = 1024 * 1024;

/** Image types accepted by the artwork pickers. */
export const ACCEPTED_ARTWORK_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

export interface ArtworkReadResult {
  dataUrl?: string;
  error?: string;
}

/** Read a File into a base64 data URL. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('The file could not be read.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate and read an artwork file chosen in an <input type="file">.
 * Every upload entry point shares these rules so limits cannot drift apart.
 */
export async function readArtworkFile(file: File): Promise<ArtworkReadResult> {
  if (!ACCEPTED_ARTWORK_TYPES.includes(file.type)) {
    return { error: 'Unsupported file type. Use PNG, JPEG, SVG or WebP.' };
  }
  if (file.size > MAX_ARTWORK_BYTES) {
    return { error: `Image is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum is 1 MB.` };
  }
  try {
    return { dataUrl: await readFileAsDataUrl(file) };
  } catch {
    return { error: 'The file could not be read. Please try another one.' };
  }
}
