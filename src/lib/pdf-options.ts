/**
 * Options passed to react-pdf Document (PDF.js getDocument).
 * - useSystemFonts: false avoids "Cannot load system font: CourierStd" warnings.
 * - standardFontDataUrl: required when useSystemFonts is false so PDF.js can load
 *   the standard PDF fonts (Helvetica, Times, Courier, etc.) from a CDN.
 * Version matches react-pdf's pdfjs-dist dependency (5.4.x).
 */
const PDFJS_VERSION = "5.4.296";

export const pdfDocumentOptions = {
  useSystemFonts: false,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
} as const;
