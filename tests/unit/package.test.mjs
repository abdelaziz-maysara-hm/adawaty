import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';
import path from 'node:path';

(async () => {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const pkgRaw = await readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(pkgRaw);
  assert.ok(pkg.version, 'package.json must have a version');
  assert.ok(pkg.scripts, 'package.json must have scripts');
  console.log('package.test.mjs: passed');
})();
