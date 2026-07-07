// Decodes a photo (JPEG or HEIC) into a downscaled JPEG blob ready to embed
// in a PDF page.
//
// HEIC wrinkle: Safari (iOS/macOS) can decode HEIC natively via
// createImageBitmap; Chrome/Edge cannot. Since each user uploads from their
// own device in their own browser, try the native path first and only pull
// in the heic2any conversion library if that fails.
const MAX_DIMENSION = 2000; // matches the mobile app's downscale-before-encode approach

function looksLikeHeic(file) {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return type.includes('heic') || type.includes('heif') || name.endsWith('.heic') || name.endsWith('.heif');
}

export async function decodeToJpeg(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (err) {
    if (!looksLikeHeic(file)) throw err;
    const heic2any = (await import('heic2any')).default;
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    bitmap = await createImageBitmap(converted);
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  return { blob, width, height };
}
