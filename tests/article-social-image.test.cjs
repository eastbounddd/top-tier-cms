const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    name => dependencies[name] || require(name), module, module.exports,
  );
  return module.exports;
}
const images = load('lib/articleSocialImage.ts', { './articlePaths': load('lib/articlePaths.ts') });
const covers = load('lib/articleCover.ts');

test('replacing or removing an image updates the preview source and its version', () => {
  const first = images.getArticleImage({ cover_image_url: 'https://example.com/a/photo.jpg' });
  const replacement = images.getArticleImage({ cover_image_url: 'https://example.com/b/photo.jpg' });
  assert.notEqual(images.getSocialImageUrl('story', first), images.getSocialImageUrl('story', replacement));
  assert.notEqual(images.getXShareArticleUrl('story', first), images.getXShareArticleUrl('story', replacement));
  assert.equal(new URL(images.getXShareArticleUrl('story', first)).pathname, '/articles/story');
  assert.notEqual(images.getSocialImageUrl('story', replacement), images.getSocialImageUrl('story', replacement + '?v=2'));
  const body = { html: '<p>New photo</p><img src="https://example.com/new.jpg?a=1&amp;b=2">' };
  assert.equal(images.getArticleImage({ cover_image_url: '', body }), 'https://example.com/new.jpg?a=1&b=2');
  assert.equal(images.getArticleImage({ cover_image_url: replacement, body }), replacement);
  assert.equal(images.getArticleImage({ body: '<p>Photo removed</p>' }), `${images.siteUrl}/top-tier-logo.png`);
});

test('social endpoint converts WebP images into a visible PNG', async () => {
  const sharp = require('sharp');
  const source = await sharp({create:{width:100,height:100,channels:3,background:'#ef1234'}}).webp().toBuffer();
  let data = {cover_image_url:'https://example.com/photo.webp',body:''};
  const query = { select() { return this; }, eq() { return this; }, async single() { return { data }; } };
  const { GET } = load('app/social-images/[slug]/route.tsx', {
    '@/lib/articleSocialImage': images,
    '@/lib/articleCover': covers,
    '@/lib/supabase/server': { createClient: async () => ({ from: () => query }) },
  });
  const originalFetch = global.fetch;
  try {
    global.fetch = async () => new Response(source, {headers:{'content-type':'image/webp'}});
    const response = await GET(new Request('https://example.com/social-images/story'), {params:Promise.resolve({slug:'story'})});
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    const image = sharp(Buffer.from(await response.arrayBuffer()));
    const meta = await image.metadata();
    assert.equal(meta.width, 1600); assert.equal(meta.height, 900);
    const pixel = await image.extract({left:800,top:450,width:1,height:1}).removeAlpha().raw().toBuffer();
    assert.ok(pixel[0] > 200 && pixel[1] < 50 && pixel[2] < 100, 'the converted image retains the source color');
    data = null;
    const missing = await GET(new Request('https://example.com/social-images/missing'), {params:Promise.resolve({slug:'missing'})});
    assert.equal(missing.status,404);
  } finally { global.fetch = originalFetch; }
});

test('cover upload stores a full-bleed 1600 × 900 WebP and keeps the original', async () => {
  const sharp = require('sharp');
  const path = 'writer/cover-originals/123-uuid-test.png';
  let source;
  let stored;
  const bucket = {
    info: async key => { assert.equal(key, path); return { data: { size: source.length } }; },
    download: async key => { assert.equal(key, path); return { data: new Blob([source]) }; },
    upload: async (key, bytes, options) => {
      assert.match(key, /^writer\/covers\/.+\.webp$/);
      assert.equal(options.contentType, 'image/webp');
      assert.equal(options.upsert, false);
      stored = bytes;
      return { error: null };
    },
    getPublicUrl: key => ({ data: { publicUrl: `https://example.com/${key}` } }),
  };
  const { POST } = load('app/api/article-cover/route.ts', {
    '@/lib/articleCover': covers,
    '@/lib/supabase/server': { createClient: async () => ({
      auth: { getUser: async () => ({ data: { user: { id: 'writer' } } }) },
      storage: { from: name => { assert.equal(name, 'article-images'); return bucket; } },
    }) },
  });
  for (const [width, height, upscaled] of [[800, 1600, true], [1800, 1800, false], [3200, 800, true], [1600, 900, false]]) {
    const colored = await sharp({ create: { width, height, channels: 3, background: '#ef1234' } }).png().toBuffer();
    // A differently colored border in the cropped-out area verifies centering.
    const edge = width / height < 16 / 9 ? { top: 20, bottom: 20 } :
      width / height > 16 / 9 ? { left: 20, right: 20 } : {};
    source = await sharp(colored).extend({ top: 0, bottom: 0, left: 0, right: 0, ...edge, background: '#000000' }).png().toBuffer();
    const response = await POST(new Request('https://example.com/api/article-cover', {
      method: 'POST', body: JSON.stringify({ path }),
    }));
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.upscaled, upscaled);
    assert.match(result.url, /\/writer\/covers\/.+\.webp$/);
    const { width: outputWidth, height: outputHeight, format } = await sharp(stored).metadata();
    assert.deepEqual([outputWidth, outputHeight, format], [1600, 900, 'webp']);
    for (const [left, top] of [[0, 0], [1599, 0], [0, 899], [1599, 899]]) {
      const pixel = await sharp(stored).extract({ left, top, width: 1, height: 1 }).raw().toBuffer();
      assert.ok(pixel[0] > 200 && pixel[1] < 50 && pixel[2] < 100);
    }
  }
});
