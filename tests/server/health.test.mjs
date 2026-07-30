import { strict as assert } from 'node:assert';
import handler from '../../api/health.js';

function makeMockRes() {
  let statusCode = 200;
  let body = null;
  return {
    status(code) { statusCode = code; return this; },
    json(obj) { body = obj; this._status = statusCode; this._body = obj; },
    get statusCode() { return statusCode; },
    get body() { return body; },
  };
}

(async () => {
  const req = { method: 'GET' };
  const res = makeMockRes();
  await handler(req, res);
  assert.equal(res._status, 200, 'health should return status 200');
  assert.ok(res._body?.ok === true, 'health ok true');
  console.log('health.test.mjs: passed');
})();
