// Rebuild every catalog.json in this repository from the directory tree.
//
// The collections are the source of truth. This script never edits the body of
// a collection, only its `root` and `parent` links, and it writes the root
// catalog and one catalog per tier directory.
//
// Run it from the repository root after you add, remove, or move a collection:
//
//   node scripts/build-catalogs.mjs
//
// Pass --check to fail instead of writing, which is what CI runs:
//
//   node scripts/build-catalogs.mjs --check

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const ROOT_TITLE = 'Wild Zarr testbed';
const ROOT_DESCRIPTION = [
  'A catalog of public Zarr and Icechunk stores in the wild, for testing Zarr',
  'support in Portolan and STAC clients. It copies no pixel data. Every',
  'collection points at the publisher\'s own store and records what a client',
  'does with it.',
  '',
  'The tiers are expected outcomes, not data themes. `renders` draws at a world',
  'view. `held-back` draws only after a zoom, because the store has no coarse',
  'level. `refused` must produce a named notice and must not fetch the store.',
  '`errors` must produce a visible load error. `pending` is not yet verified in',
  'a browser.',
].join('\n');

// One entry per tier directory, in the order the root catalog lists them.
const TIERS = [
  { dir: 'renders', title: 'Renders', description: 'Stores that draw at a world view, with no zoom gesture.' },
  { dir: 'held-back', title: 'Held back', description: 'Stores that draw only after a zoom, because no coarse level exists. A client must say so rather than hang.' },
  { dir: 'refused', title: 'Refused', description: 'Stores a client must refuse from metadata alone, with a named reason and no chunk fetched.' },
  { dir: 'errors', title: 'Errors', description: 'Stores that must produce a visible load error, promptly, and never a silent hang.' },
  { dir: 'client-gaps', title: 'Client gaps', description: 'Stores that look conformant, where the client today does the wrong thing. Each description records what was measured.' },
  { dir: 'pending', title: 'Pending', description: 'Stores added to the testbed but not yet verified in a browser.' },
];

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function collectionsIn(tierDir) {
  const base = join(ROOT, tierDir);
  if (!await exists(base)) { return []; }
  const entries = await readdir(base, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) { continue; }
    const path = join(base, entry.name, 'collection.json');
    if (!await exists(path)) { continue; }
    out.push({ id: entry.name, path, doc: JSON.parse(await readFile(path, 'utf-8')) });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

const changed = [];

async function write(path, body) {
  const current = await exists(path) ? await readFile(path, 'utf-8') : null;
  if (current === body) { return; }
  changed.push(path.slice(ROOT.length + 1));
  if (!CHECK) { await writeFile(path, body); }
}

// A collection's own links. Everything else in the document is left alone, so
// a hand-edited description or render survives a rebuild.
function withLinks(doc, tier) {
  const keep = (doc.links ?? []).filter(l => !['root', 'parent', 'self'].includes(l.rel));
  return {
    ...doc,
    links: [
      { rel: 'root', href: '../../catalog.json', type: 'application/json', title: ROOT_TITLE },
      { rel: 'parent', href: '../catalog.json', type: 'application/json', title: tier.title },
      ...keep,
    ],
  };
}

const counts = [];

for (const tier of TIERS) {
  const collections = await collectionsIn(tier.dir);
  counts.push({ tier: tier.dir, count: collections.length });
  if (collections.length === 0) { continue; }

  for (const collection of collections) {
    await write(collection.path, json(withLinks(collection.doc, tier)));
  }

  await write(join(ROOT, tier.dir, 'catalog.json'), json({
    type: 'Catalog',
    stac_version: '1.1.0',
    id: `zarr-testbed-${tier.dir}`,
    title: `${ROOT_TITLE}: ${tier.title}`,
    description: tier.description,
    links: [
      { rel: 'root', href: '../catalog.json', type: 'application/json', title: ROOT_TITLE },
      { rel: 'parent', href: '../catalog.json', type: 'application/json', title: ROOT_TITLE },
      ...collections.map(c => ({
        rel: 'child',
        href: `./${c.id}/collection.json`,
        type: 'application/json',
        title: c.doc.title ?? c.id,
      })),
    ],
  }));
}

const present = TIERS.filter(t => counts.find(c => c.tier === t.dir)?.count);

await write(join(ROOT, 'catalog.json'), json({
  type: 'Catalog',
  stac_version: '1.1.0',
  id: 'zarr-testbed',
  title: ROOT_TITLE,
  description: ROOT_DESCRIPTION,
  links: [
    { rel: 'root', href: './catalog.json', type: 'application/json', title: ROOT_TITLE },
    ...present.map(t => ({
      rel: 'child',
      href: `./${t.dir}/catalog.json`,
      type: 'application/json',
      title: `${t.title} (${counts.find(c => c.tier === t.dir).count})`,
    })),
    { rel: 'about', href: 'https://github.com/portolan-sdi/portolan-spec/issues/132', type: 'text/html', title: 'portolan-spec issue 132: Zarr conventions and best practices' },
  ],
}));

const total = counts.reduce((sum, c) => sum + c.count, 0);
console.log(`${total} collections: ${counts.map(c => `${c.tier} ${c.count}`).join(', ')}`);

if (changed.length === 0) {
  console.log('catalogs up to date');
} else if (CHECK) {
  console.error(`\n${changed.length} file(s) out of date. Run: node scripts/build-catalogs.mjs`);
  for (const path of changed) { console.error(`  ${path}`); }
  process.exit(1);
} else {
  console.log(`wrote ${changed.length} file(s)`);
}
