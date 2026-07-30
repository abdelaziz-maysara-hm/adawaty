import { PDFDocument } from 'pdf-lib';

// Simple serverless endpoint to merge multiple PDFs sent as base64 strings.
// Expects POST { files: [ base64PdfString, ... ] }
// Returns { ok: true, result: base64MergedPdf }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Only POST supported' });
    return;
  }

  try {
    const { files } = req.body ?? {};
    if (!Array.isArray(files) || files.length === 0) {
      res.status(400).json({ ok: false, error: 'Provide an array `files` of base64-encoded PDFs' });
      return;
    }

    const mergedPdf = await PDFDocument.create();

    for (const b64 of files) {
      if (typeof b64 !== 'string') {
        res.status(400).json({ ok: false, error: 'Each file must be a base64 string' });
        return;
      }
      const bytes = Buffer.from(b64, 'base64');
      const srcDoc = await PDFDocument.load(bytes);
      const copied = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
      copied.forEach((p) => mergedPdf.addPage(p));
    }

    const mergedBytes = await mergedPdf.save();
    const mergedB64 = Buffer.from(mergedBytes).toString('base64');

    res.status(200).json({ ok: true, result: mergedB64 });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
}
