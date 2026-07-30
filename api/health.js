import { readFile } from 'node:fs/promises';
import path from 'node:path';

export default async function handler(req, res) {
  try {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const raw = await readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(raw);
    res.status(200).json({ ok: true, version: pkg?.version ?? 'unknown' });
  } catch (err) {
    res.status(200).json({ ok: true, version: 'unknown' });
  }
}
