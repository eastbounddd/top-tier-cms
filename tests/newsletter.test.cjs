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

const { createHash } = require('node:crypto');
const newsletter = load('lib/newsletter.ts');
const loadRoute = () => load('app/api/newsletter/route.ts', {
  '@/lib/newsletter': newsletter,
  '@/lib/emailOctopus': load('lib/emailOctopus.ts'),
}).POST;
const origin = 'http://localhost:3000';
const request = (body, ip = '192.0.2.1', contentType = 'application/json', requestOrigin = origin) =>
  new Request(origin + newsletter.newsletterEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': contentType, origin: requestOrigin, 'x-vercel-forwarded-for': ip },
    body: contentType === 'application/json' ? JSON.stringify(body) : new URLSearchParams(body),
  });

test('upserts new and existing contacts with exact list tags and consent', async t => {
  const post = loadRoute();
  const listUrl = 'https://api.emailoctopus.com/lists/mock-list';
  const email = 'reader@example.com';
  const contactUrl = listUrl + '/contacts/' + createHash('md5').update(email).digest('hex');
  const originalFetch = global.fetch;
  const previous = { ...process.env };
  process.env.EMAILOCTOPUS_API_KEY = 'test-key';
  process.env.EMAILOCTOPUS_LIST_ID = 'mock-list';
  t.after(() => {
    global.fetch = originalFetch;
    for (const name of ['EMAILOCTOPUS_API_KEY', 'EMAILOCTOPUS_LIST_ID']) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  });
  let contact, schemaLookups = 0, writes = 0, conflict = false;
  global.fetch = async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    assert.equal(options.cache, 'no-store');
    if (url === listUrl) {
      schemaLookups++;
      return Response.json({ fields: [
        { label: 'First Name', tag: 'given_name' },
        { label: 'Last Name', tag: 'surname' },
        { label: 'Consent', tag: 'ConsentCustomTag' },
      ] });
    }
    if (url === contactUrl) return contact ? Response.json(contact) : new Response(null, { status: 404 });
    assert.equal(url, listUrl + '/contacts');
    assert.equal(options.method, 'PUT');
    const body = JSON.parse(options.body);
    assert.equal(body.email_address, email);
    assert.equal(body.status, 'subscribed');
    writes++;
    if (writes === 1) assert.deepEqual(body.fields, { given_name: 'Pat', surname: 'Lee', ConsentCustomTag: 'yes' });
    else assert.deepEqual(body.fields, { ConsentCustomTag: 'yes' });
    if (conflict) return new Response(null, { status: 409 });
    contact = { ...body, fields: { ...contact?.fields, ...body.fields } };
    return Response.json(contact);
  };
  const first = await post(request({ email: ' Reader@Example.COM ', firstName: ' Pat ', lastName: 'Lee' }));
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await first.json(), { status: 'success', message: "You're in! Watch your inbox for Top Tier Weekly." });
  for (const contentType of ['application/json', 'application/x-www-form-urlencoded']) {
    const response = await post(request({ email }, '192.0.2.1', contentType));
    assert.deepEqual(await response.json(), { status: 'subscribed', message: "You're already subscribed." });
  }
  conflict = true;
  assert.equal((await (await post(request({ email }))).json()).status, 'subscribed');
  assert.equal(contact.fields.ConsentCustomTag, 'yes');
  assert.equal(contact.fields.given_name, 'Pat');
  assert.equal(writes, 4);
  assert.equal(schemaLookups, 1);
});

test('rejects invalid names, email, bot patterns, honeypot, and excessive requests locally', async t => {
  const post = loadRoute();
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls++; throw new Error('Unexpected network request'); };
  t.after(() => { global.fetch = originalFetch; });
  const invalid = [
    { email: 'invalid' },
    { email: 'reader@example.com', website: 'bot' },
    { email: 'aaaaaaaaaaaa@example.com' },
    { email: 'reader@nowhere.invalid' },
    { email: 'reader@example.com', firstName: {} },
  ];
  for (const input of invalid) assert.equal((await post(request(input))).status, 400);
  const limited = await post(request({ email: 'reader@example.com' }));
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
  assert.equal((await post(request({ email: 'bad' }, '192.0.2.2'))).status, 400);
  assert.equal((await post(request({ email: 'x'.repeat(3000) }, '192.0.2.2'))).status, 413);
  assert.equal((await post(request({}, '192.0.2.2', 'application/json', 'https://other.example'))).status, 403);
  assert.equal(calls, 0);
});
