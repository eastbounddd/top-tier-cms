const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
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
  assert.notEqual(images.getSocialImageUrl('story', replacement), images.getSocialImageUrl('story', replacement + '?v=2'));
  const body = { html: '<p>New photo</p><img src="https://example.com/new.jpg?a=1&amp;b=2">' };
  assert.equal(images.getArticleImage({ cover_image_url: '', body }), 'https://example.com/new.jpg?a=1&b=2');
  assert.equal(images.getArticleImage({ cover_image_url: replacement, body }), replacement);
  assert.equal(images.getArticleImage({ body: '<p>Photo removed</p>' }), `${images.siteUrl}/top-tier-logo.png`);
});

test('social endpoint renders current body photo or logo without caching stale previews', async () => {
  let data;
  const query = { select() { return this; }, eq() { return this; }, async single() { return { data }; } };
  const { GET } = load('app/social-images/[slug]/route.tsx', {
    '@/lib/articleSocialImage': images,
    '@/lib/supabase/server': { createClient: async () => ({ from: () => query }) },
    'next/og': { ImageResponse: class {
      constructor(element, options) { this.element = element; this.headers = new Headers(options.headers); }
    } },
  });
  for (const source of ['https://example.com/old.jpg', 'https://example.com/new.jpg', null]) {
    data = { cover_image_url: '', body: source ? { html: `<img src="${source}">` } : '' };
    const response = await GET(new Request('https://example.com/social-images/story?v=old'), { params: Promise.resolve({ slug: 'story' }) });
    assert.equal(response.element.props.children.props.src, source || `${images.siteUrl}/top-tier-logo.png`);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  data = null;
  const missing = await GET(new Request('https://example.com/social-images/missing'), { params: Promise.resolve({ slug: 'missing' }) });
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('cache-control'), 'no-store');
});
