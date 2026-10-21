// Builds the static site in ./site from the page sources in ./src/pages.
// Each source page is a self-contained design file: <helmet> (fonts + CSS), an <x-dc> template,
// and a logic script (class Component extends DCLogic). This turns each one into a plain HTML page.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'htmlparser2';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'site');
const SITE_URL = 'https://braces.co.il';
// Web3Forms access key (free, made at web3forms.com with the office email). Set WEB3FORMS_KEY in Vercel.
const WEB3FORMS_KEY = process.env.WEB3FORMS_KEY || '';

const PAGES = {
  index: { file: 'index.dc.html', description: 'Paley Orthodontics in Modiin: American-trained orthodontist Dr. Jonathan Paley, treating children and adults. Damon System, Invisalign and clear ceramic braces.' },
  about: { file: 'about.dc.html', description: 'Meet Dr. Jonathan Paley, an American-trained orthodontist with over 25 years of experience, now caring for smiles in Modiin.' },
  children: { file: 'children.dc.html', description: 'Why your child should have a first orthodontic check-up by age 7, and the benefits of early treatment at Paley Orthodontics, Modiin.' },
  adults: { file: 'adults.dc.html', description: 'Orthodontics for adults in Modiin: clear ceramic braces, Invisalign and the Damon System with Dr. Jonathan Paley.' },
  contact: { file: 'contact.dc.html', description: 'Contact Paley Orthodontics, 37 Yigael Yadin, Modiin. Call 08-972-9410 or book a consultation online.' }
};

// Canvas asset ids and page links -> real site paths.
const BLOBS = {
  '99b497c42ee47cb50ec44a8d279c7155': 'hp1-jp.webp',
  '07d55669572525552748572294fbe6cc': 'hp2-jp.webp',
  '6c5a52a8f753105c800e44c92643fa85': 'hp3-jp.webp',
  '285e54a7c63f29a967afe73f151e6165': 'hp-about-paley-orthodontics-modiin.webp',
  '2e5fc5910ed49f7788829d871dfdee2e': 'logo-paley.png',
  'e5a6a81de4a19dd3b2ae65ab636a0c57': 'damonsmile.png',
  '33a841e63317b6570df118a666959543': 'invisalign.jpg',
  '98ec08798004c7d6333a8d4e6ca64ae4': 'ida.jpg',
  '5f5ab5bbb8248c5a94a84a94c48055ad': 'aao.png',
  'fa45f7a653d4dadfb3bdfca29fcba070': 'abo.jpg',
  '9e15603f1e601eb407820e7ac2ff336c': 'paper-grain.png'
};
const LINKS = {
  'Main.dc.html': '/',
  'About.dc.html': '/about',
  'Children.dc.html': '/children',
  'Adults.dc.html': '/adults',
  'Contact.dc.html': '/contact'
};

function rewrite(src) {
  let s = src.replace(/\/_blob\/([0-9a-f]{32})/g, (m, id) => {
    if (!BLOBS[id]) throw new Error('Unknown asset ' + id);
    return '/assets/' + BLOBS[id];
  });
  for (const [from, to] of Object.entries(LINKS)) s = s.split('href="' + from).join('href="' + to);
  return s;
}

function toTree(nodes) {
  const out = [];
  for (const n of nodes) {
    if (n.type === 'text') out.push({ t: 'text', d: n.data });
    else if (n.type === 'tag' || n.type === 'script' || n.type === 'style') {
      out.push({ n: n.name, a: { ...n.attribs }, c: toTree(n.children || []) });
    }
  }
  return out;
}

function trimEdges(tree) {
  while (tree.length && tree[0].t === 'text' && !tree[0].d.trim()) tree.shift();
  while (tree.length && tree[tree.length - 1].t === 'text' && !tree[tree.length - 1].d.trim()) tree.pop();
  return tree;
}

function pick(re, s, label, file) {
  const m = s.match(re);
  if (!m) throw new Error(`No ${label} in ${file}`);
  return m[1];
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'js'), { recursive: true });
mkdirSync(join(OUT, 'assets'), { recursive: true });

copyFileSync(join(ROOT, 'node_modules/preact/dist/preact.module.js'), join(OUT, 'js/preact.module.js'));
if (!WEB3FORMS_KEY) console.warn('WARNING: WEB3FORMS_KEY is not set, so the contact forms will show an error instead of sending.');
writeFileSync(join(OUT, 'js/runtime.js'), readFileSync(join(ROOT, 'src/runtime.js'), 'utf8').replace('__WEB3FORMS_KEY__', WEB3FORMS_KEY));
for (const f of readdirSync(join(ROOT, 'src/assets'))) copyFileSync(join(ROOT, 'src/assets', f), join(OUT, 'assets', f));

for (const [name, page] of Object.entries(PAGES)) {
  const raw = rewrite(readFileSync(join(ROOT, 'src/pages', page.file), 'utf8'));
  const title = pick(/<title>([\s\S]*?)<\/title>/, raw, 'title', page.file).trim();
  const helmet = pick(/<helmet>([\s\S]*?)<\/helmet>/, raw, 'helmet', page.file);
  const xdc = pick(/<x-dc>([\s\S]*?)<\/x-dc>/, raw, 'x-dc', page.file).replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  const logic = pick(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/, raw, 'logic script', page.file);
  const doc = parseDocument(xdc, { lowerCaseTags: false, lowerCaseAttributeNames: false, recognizeSelfClosing: true, decodeEntities: true });
  const tree = trimEdges(toTree(doc.children));
  const url = SITE_URL + (name === 'index' ? '/' : '/' + name);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${page.description}">
<meta name="theme-color" content="#302B79">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="he" href="https://braces.co.il/he">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${page.description}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:image" content="${SITE_URL}/assets/hp1-jp.webp">
<link rel="icon" type="image/png" href="/assets/favicon.png">
${helmet.trim()}
</head>
<body>
<div id="app"></div>
<noscript><p style="padding:24px;font-family:sans-serif">Paley Orthodontics · 37 Yigael Yadin, Modiin · 08-972-9410 · smile@braces.co.il</p></noscript>
<script type="module">
import { DCLogic, mount, sendForm } from '/js/runtime.js';
${logic.trim()}
mount(${JSON.stringify(tree)}, Component);
</script>
</body>
</html>
`;
  writeFileSync(join(OUT, name + '.html'), html);
  console.log('built', name + '.html', (html.length / 1024).toFixed(0) + ' KB');
}

const urls = Object.keys(PAGES).map((name) => SITE_URL + (name === 'index' ? '/' : '/' + name));
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log('built sitemap.xml, robots.txt');
