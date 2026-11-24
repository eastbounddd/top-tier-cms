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
const images = load('lib/articleSocialImage.ts');

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
    assert.equal(meta.width, 1200); assert.equal(meta.height, 675);
    const pixel = await image.extract({left:600,top:337,width:1,height:1}).removeAlpha().raw().toBuffer();
    assert.ok(pixel[0] > 200 && pixel[1] < 50 && pixel[2] < 100, 'the converted image retains the source color');
    data = null;
    const missing = await GET(new Request('https://example.com/social-images/missing'), {params:Promise.resolve({slug:'missing'})});
    assert.equal(missing.status,404);
  } finally { global.fetch = originalFetch; }
});
