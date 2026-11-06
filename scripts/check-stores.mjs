// Check that every store this testbed points at is still reachable from a
// browser, and write the result to STATUS.md.
//
// Wild stores rot. A publisher moves a bucket, drops a CORS header, or deletes
// a snapshot, and a testbed that does not notice starts reporting its own rot
// as a client defect. This script separates the two.
//
// It reads one metadata document per store, with an `Origin` header, so it
// measures what a browser measures:
//
//   - the HTTP status of the store's own metadata
//   - whether `Access-Control-Allow-Origin` permits a cross-origin read
//
// It does not read a chunk and it does not judge whether the store draws. The
// browser harness does that. See the README.
//
// Run it from the repository root:
//
//   node scripts/check-stores.mjs            # write STATUS.md
//   node scripts/check-stores.mjs --quiet    # only print failures
//
// It exits non-zero when a store that was reachable is now unreachable, so CI
// can open an issue.

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUIET = process.argv.includes('--quiet');
const ORIGIN = 'https://example.org';
const TIMEOUT = 30_000;

// A store href is a directory. These are the documents that identify one, in
// the order to try. An Icechunk repository answers on none of them, so it
// falls back to its own config document.
// A store href is a directory. These are the documents that identify one, in
// the order to try.
//
// Every Icechunk repository in this testbed is a bare repository: one `repo`
// key at the store root, holding the magic `ICE<snowflake>CHUNK` and the
// writer version, with no `refs/` prefix at all. Measured on all 6 of them,
// written by icechunk 2.2.2 through 2.3.1. The older ref layouts are listed
// after it because icechunk-js still asks for them, and a repository written
// by an earlier version answers there instead.
const PROBES = [
  'zarr.json',                        // Zarr v3 group or array
  '.zmetadata',                       // Zarr v2, consolidated
  '.zgroup',                          // Zarr v2 group
  'repo',                             // Icechunk, bare repository
  'refs/branch.main/ref.json',        // Icechunk, current ref layout
  'refs/branch.main/ZZZZZZZZ.json',   // Icechunk, inverted-counter ref layout
  'config.yaml',                      // Icechunk, repository config
];

// The writer version an Icechunk `repo` document announces, or null. The
// document opens with `ICE`, a snowflake, `CHUNK`, then an ASCII version such
// as `ic-2.3.1`.
function icechunkVersion(bytes) {
  if (!bytes) { return null; }
  const head = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 64));
  if (!head.startsWith('ICE')) { return null; }
  return head.match(/ic-[0-9][0-9A-Za-z.-]*/)?.[0] ?? null;
}

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function collections() {
  const out = [];
  for (const tier of await readdir(ROOT, { withFileTypes: true })) {
    if (!tier.isDirectory() || tier.name.startsWith('.') || tier.name === 'scripts') { continue; }
    for (const entry of await readdir(join(ROOT, tier.name), { withFileTypes: true })) {
      if (!entry.isDirectory()) { continue; }
      const path = join(ROOT, tier.name, entry.name, 'collection.json');
      if (!await exists(path)) { continue; }
      out.push({ tier: tier.name, id: entry.name, doc: JSON.parse(await readFile(path, 'utf-8')) });
    }
  }
  return out.sort((a, b) => (a.tier + a.id).localeCompare(b.tier + b.id));
}

// The store assets of a collection: the ones a browser could open. An `s3://`
// href is skipped, because a browser cannot read it.
function storeAssets(doc) {
  return Object.entries(doc.assets ?? {})
    .filter(([, asset]) => typeof asset.href === 'string' && asset.href.startsWith('https://'))
    .filter(([, asset]) => /zarr|icechunk/i.test(asset.type ?? ''));
}

async function head(url) {
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), TIMEOUT);
  try {
    const response = await fetch(url, { headers: { Origin: ORIGIN }, signal: control.signal });
    // A metadata document is small, so read it: the first bytes identify an
    // Icechunk repository and name the version that wrote it.
    const body = await response.arrayBuffer().then(b => new Uint8Array(b)).catch(() => null);
    return {
      status: response.status,
      cors: response.headers.get('access-control-allow-origin'),
      writer: icechunkVersion(body),
    };
  } catch (error) {
    return { status: 0, cors: null, error: error.name === 'AbortError' ? 'timeout' : String(error.message ?? error) };
  } finally {
    clearTimeout(timer);
  }
}

async function probe(href) {
  const base = href.endsWith('/') ? href : `${href}/`;
  let last = null;
  for (const name of PROBES) {
    const result = await head(base + name);
    last = { ...result, document: name };
    if (result.status === 200) { return last; }
    // A 403 on one document still proves the host answers and sends CORS.
    if (result.status === 403 && result.cors) { return last; }
  }
  return last;
}

const rows = [];
let failures = 0;

for (const collection of await collections()) {
  for (const [key, asset] of storeAssets(collection.doc)) {
    const result = await probe(asset.href);
    const corsOk = result.cors === '*' || result.cors === ORIGIN;
    // The one store in `errors` is expected to have no CORS header. That is
    // the case it tests, so a missing header there is a pass.
    const wantsCors = collection.tier !== 'errors';
    const ok = result.status === 200 && (corsOk || !wantsCors);
    if (!ok) { failures += 1; }
    rows.push({
      tier: collection.tier, id: collection.id, key,
      status: result.status || (result.error ?? 'error'),
      cors: result.cors ?? '(none)',
      document: result.document,
      writer: result.writer,
      ok,
    });
    if (!QUIET || !ok) {
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${collection.tier}/${collection.id} [${key}] ${result.status || result.error} cors=${result.cors ?? '(none)'}`);
    }
  }
}

const date = new Date().toISOString().slice(0, 10);
const body = [
  '# Store status',
  '',
  `Checked ${date} by \`node scripts/check-stores.mjs\`.`,
  '',
  'This table says whether each store answers a browser, not whether it draws.',
  'A store in the `errors` tier is expected to send no CORS header.',
  '',
  '| Tier | Collection | Asset | Status | Access-Control-Allow-Origin | Document read | Writer |',
  '| ---- | ---------- | ----- | ------ | --------------------------- | ------------- | ------ |',
  ...rows.map(r => `| ${r.tier} | ${r.id} | \`${r.key}\` | ${r.ok ? r.status : `**${r.status}**`} | \`${r.cors}\` | \`${r.document}\` | ${r.writer ? `\`${r.writer}\`` : ''} |`),
  '',
  `${rows.length} store assets checked. ${failures} unreachable.`,
].join('\n');

await writeFile(join(ROOT, 'STATUS.md'), `${body}\n`);
console.log(`\n${rows.length} checked, ${failures} unreachable. Wrote STATUS.md`);
process.exit(failures > 0 ? 1 : 0);
