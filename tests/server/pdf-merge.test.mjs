import { strict as assert } from 'node:assert';
import handler from '../../api/pdf/merge.js';

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
  // invalid payload
  const req1 = { method: 'POST', body: { files: [] } };
  const res1 = makeMockRes();
  await handler(req1, res1);
  assert.equal(res1._status, 400, 'should return 400 for empty files array');

  // invalid item type
  const req2 = { method: 'POST', body: { files: [123] } };
  const res2 = makeMockRes();
  await handler(req2, res2);
  assert.equal(res2._status, 400, 'should return 400 for non-string file item');

  console.log('pdf/merge tests (basic validation) passed');
})();
