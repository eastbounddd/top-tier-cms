const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    name => dependencies[name] || require(name), module, module.exports,
  );
  return module.exports;
}
const newsletter = load('lib/newsletter.ts');
const { POST } = load('app/api/newsletter/route.ts', { '@/lib/newsletter': newsletter });
const request = (body, origin = 'http://localhost:3000') => new Request('http://localhost:3000/api/newsletter', {
  method: 'POST', headers: { 'Content-Type': 'application/json', origin }, body: JSON.stringify(body),
});

test('Mailchimp responses distinguish subscribed, pending, existing, and failures', () => {
  for (const [result, msg, expected] of [
    ['success', 'Thank you for subscribing!', 'success'],
    ['success', 'Please confirm your subscription in the email we sent you.', 'pending'],
    ['error', 'reader@example.com is already subscribed to list.', 'subscribed'],
    ['error', '<a href="https://example.com">Please complete CAPTCHA</a>', 'error'],
  ]) {
    const parsed = newsletter.parseMailchimpResponse(`newsletter(${JSON.stringify({ result, msg })})`);
    assert.equal(parsed.status, expected);
    assert.ok(!parsed.message.includes('<a'));
    assert.ok(!parsed.message.includes('reader@example.com'));
  }
  assert.throws(() => newsletter.parseMailchimpResponse('<html>Challenge</html>'));
  assert.throws(() => newsletter.parseMailchimpResponse('{"result":"unknown","msg":"hello"}'));
});

test('handler validates locally and sends the exact audience fields upstream', async () => {
  const original = global.fetch;
  let calls = 0;
  global.fetch = async (url, options) => {
    calls++;
    assert.equal(url.origin, 'https://toptierstate.us18.list-manage.com');
    assert.equal(url.pathname, '/subscribe/post-json');
    assert.equal(url.searchParams.get('u'), 'd74e761f7f05ede1718912346');
    assert.equal(url.searchParams.get('id'), '0a37f9d12b');
    assert.equal(url.searchParams.get('f_id'), '000aa4e6f0');
    assert.equal(url.searchParams.get('EMAIL'), 'reader@example.com');
    assert.equal(url.searchParams.get(newsletter.MAILCHIMP_HONEYPOT), '');
    assert.equal(options.cache, 'no-store');
    return new Response('newsletter({"result":"success","msg":"Thank you for subscribing!"})');
  };
  try {
    for (const EMAIL of ['', 'invalid', 'a@@example.com', 'x'.repeat(255)]) {
      assert.equal((await POST(request({ EMAIL }))).status, 400);
    }
    assert.equal((await POST(request({ EMAIL: 'reader@example.com', [newsletter.MAILCHIMP_HONEYPOT]: 'bot' }))).status, 400);
    assert.equal((await POST(request({ EMAIL: 'reader@example.com' }, 'https://other.example'))).status, 403);
    assert.equal((await POST(request({ EMAIL: 'x'.repeat(3000) }))).status, 413);
    assert.equal(calls, 0);
    const response = await POST(request({ EMAIL: ' reader@example.com ', [newsletter.MAILCHIMP_HONEYPOT]: '' }));
    assert.equal((await response.json()).status, 'success');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(calls, 1);
    for (const upstream of [() => Promise.reject(new Error('timeout')), async () => new Response('<html>Challenge</html>'), async () => new Response('', { status: 429 })]) {
      global.fetch = upstream;
      const response = await POST(request({ EMAIL: 'reader@example.com' }));
      assert.equal(response.status, 502);
      assert.equal((await response.json()).fallback, true);
    }
  } finally { global.fetch = original; }
});
