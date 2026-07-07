import { PDFDocument } from 'pdf-lib';
import { decodeToJpeg } from './imageDecode.js';

const MAX_PAGE_POINTS = 792; // 11in at 72pt/in — long edge of a US Letter page

// One photo -> one single-page PDF, page sized to the photo's own aspect
// ratio (mirroring the mobile app's ConfirmationScreen, not a fixed
// print-page shape). Already-PDF input passes through untouched.
export async function photoToPdf(file) {
  const { blob, width, height } = await decodeToJpeg(file);
  const imageBytes = await blob.arrayBuffer();

  const pdfDoc = await PDFDocument.create();
  const jpgImage = await pdfDoc.embedJpg(imageBytes);

  const scale = MAX_PAGE_POINTS / Math.max(width, height);
  const pageWidth = width * scale;
  const pageHeight = height * scale;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  page.drawImage(jpgImage, { x: 0, y: 0, width: pageWidth, height: pageHeight });

  return pdfDoc.save();
}

export function isPdf(file) {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return type === 'application/pdf' || name.endsWith('.pdf');
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tif', '.tiff', '.heic', '.heif'];

// Whether this is something photoToPdf knows how to convert. Anything else
// (docx, txt, zip, ...) isn't a "pic" — it gets uploaded untouched instead
// of being forced through the photo pipeline.
export function isImage(file) {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  if (type.startsWith('image/')) return true;
  return IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext));
}
