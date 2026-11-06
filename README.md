# Wild Zarr testbed

A STAC catalog of **28 public Zarr and Icechunk stores in the wild**, built to
test Zarr support in [Portolan](https://www.portolan-sdi.org/) and in STAC
clients generally.

It copies no pixel data. Every collection points at the publisher's own store
and records what a client actually does with it. Think of it as a conformance
suite assembled from real data rather than from fixtures.

**Open it in a browser:**

- **[Portolan Browser](https://browser.portolan-sdi.org/#/external/raw.githubusercontent.com/cholmes/zarr-testbed/refs/heads/main/catalog.json)**
- [STAC Browser](https://radiantearth.github.io/stac-browser/#/external/raw.githubusercontent.com/cholmes/zarr-testbed/refs/heads/main/catalog.json)
- The root document: <https://raw.githubusercontent.com/cholmes/zarr-testbed/refs/heads/main/catalog.json>

The catalog is served straight from `raw.githubusercontent.com`, which sends
`Access-Control-Allow-Origin: *`, so a browser on any origin can read it. There
is nothing to deploy. Raw responses are cached for about five minutes, so a
push takes a moment to show up.

## Why this exists

Portolan requires raster data as COG. Zarr is the natural format for data that
COG does not represent well, such as a cube indexed by time or depth, so
Portolan wants a Zarr profile. The open question in
[portolan-spec#132](https://github.com/portolan-sdi/portolan-spec/issues/132)
is what that profile should require.

That question needs evidence. A rule that sounds right against one store often
fails against the next one. The useful unit of evidence is not "Zarr works" but
"this store, at this URL, does this in a browser, for this reason". This
repository holds that evidence in a form a client can be pointed at.

The companion work is
[portolan-browser#92](https://github.com/portolan-sdi/portolan-browser/pull/92),
which renders Zarr and Icechunk with deck.gl, zarrita and icechunk-js. Of the
22 stores in the first pass of this set, 2 drew before that work and 11 after
it. The set is now 28 collections, of which 13 draw.

## How it is organized

The tiers are **expected outcomes, not data themes**. That makes the catalog
usable as a test matrix: open a tier and every collection in it should behave
the same way.

| Tier | Count | A conforming client must |
| ---- | ----- | ------------------------ |
| `renders` | 9 | draw pixels at a world view, with no zoom gesture |
| `held-back` | 4 | say the store has no coarse level, then draw once zoomed in |
| `refused` | 13 | refuse from metadata alone, with a named reason, fetching no chunk |
| `errors` | 1 | show a visible load error, promptly, and never hang |
| `client-gaps` | 1 | draw it, and today does not. These are open bugs, not store faults |

`refused` is the tier that matters most for the spec. A store there is valid
Zarr. It is refused because drawing it would cost more than it is worth, or
because no client can place its pixels. Each refusal names which rule it
breaks, so the tier doubles as the argument for each rule.

The `client-gaps` tier is deliberate. A testbed that only holds cases the
client already passes stops being useful the day it is written.

Every collection says whether its outcome is **expected** or **measured**, and
a measured one carries the date and the notice text verbatim. All six
collections added on 2026-11-06 are measured.

## The stores


### Renders

| Collection | Host | What it tests |
| ---------- | ---- | ------------- |
| [`carbonplan-2d-tavg`](renders/carbonplan-2d-tavg/collection.json) | storage.googleapis.com | ndpyramid, multiscales-paths-only, climate |
| [`carbonplan-3d-tavg-prec`](renders/carbonplan-3d-tavg-prec/collection.json) | storage.googleapis.com | ndpyramid, two-variables, climate |
| [`carbonplan-v2-2d-tavg`](renders/carbonplan-v2-2d-tavg/collection.json) | storage.googleapis.com | ndpyramid, coarsest-one-chunk, climate |
| [`eopf-s2-l2a-zarr3`](renders/eopf-s2-l2a-zarr3/collection.json) | data.eodc.eu | zarr-v3, utm, sentinel-2, band-selection |
| [`ftw-predictions-zarr`](renders/ftw-predictions-zarr/collection.json) | data.source.coop | zarr-v3, sharded, multiscales-array, 14-levels, control |
| [`italy-aerial-ortho`](renders/italy-aerial-ortho/collection.json) | data.source.coop | orthophoto, rgba, multiscales-object, zarr-v3 |
| [`nasa-rasi-icechunk-virtual`](renders/nasa-rasi-icechunk-virtual/collection.json) | nasa-waterinsight.s3 | icechunk, virtual, cross-host-cors, soil-moisture |
| [`tessera-life-biodiversity`](renders/tessera-life-biodiversity/collection.json) | data.source.coop | zarr-v3, diverging-ramp, biodiversity |
| [`wsf-tracker`](renders/wsf-tracker/collection.json) | data.source.coop | zarr-v3, sharded, 13-levels, categorical |

### Held back

| Collection | Host | What it tests |
| ---------- | ---- | ------------- |
| [`carbonplan-v1-2d-tavg`](held-back/carbonplan-v1-2d-tavg/collection.json) | storage.googleapis.com | ndpyramid, coarsest-32-chunks, zoom-guard, climate |
| [`ctrees-agb-icechunk`](held-back/ctrees-agb-icechunk/collection.json) | ctrees-agb-100m-global.s3 | icechunk, no-overviews, zoom-guard, biomass |
| [`ftw-features-composites`](held-back/ftw-features-composites/collection.json) | data.source.coop | no-overviews, sentinel-2, zarr-v3 |
| [`mur-sst`](held-back/mur-sst/collection.json) | mur-sst.s3 | zarr-v2, float32-coordinates, no-overviews, zoom-guard, sst |

### Refused

| Collection | Host | What it tests |
| ---------- | ---- | ------------- |
| [`carbonplan-4d-climate`](refused/carbonplan-4d-climate/collection.json) | storage.googleapis.com | chunk-amplification, ndpyramid, zarr-v2, climate |
| [`cbofs-ssh`](refused/cbofs-ssh/collection.json) | noaa-nodd-kerchunk-pds.s3 | curvilinear-coordinates, no-crs, roms, zarr-v3 |
| [`cmip6-gfdl-tas`](refused/cmip6-gfdl-tas/collection.json) | storage.googleapis.com | chunk-amplification, cmip6, zarr-v2, climate |
| [`dynamical-gfs-analysis`](refused/dynamical-gfs-analysis/collection.json) | dynamical-noaa-gfs.s3 | chunk-amplification, icechunk, weather |
| [`dynamical-gfs-virtual-gribberish`](refused/dynamical-gfs-virtual-gribberish/collection.json) | dynamical-noaa-gfs.s3 | codec, gribberish, icechunk, virtual |
| [`eopf-s2-l2a-v2-band`](refused/eopf-s2-l2a-v2-band/collection.json) | data.eodc.eu | no-overviews, malformed-media-type, sentinel-2, zarr-v2 |
| [`gmgsi-icechunk`](refused/gmgsi-icechunk/collection.json) | data.source.coop | curvilinear-coordinates, no-crs, icechunk |
| [`its-live-velocity`](refused/its-live-velocity/collection.json) | its-live-data.s3 | chunk-amplification, glacier-velocity, zarr-v2 |
| [`noaa-gefs-analysis`](refused/noaa-gefs-analysis/collection.json) | data.source.coop | chunk-amplification, zarr-v3, weather |
| [`noaa-hrrr-analysis`](refused/noaa-hrrr-analysis/collection.json) | dynamical-noaa-hrrr.s3 | chunk-amplification, projected-crs, lambert-conformal-conic, icechunk, weather |
| [`nwm-streamflow`](refused/nwm-streamflow/collection.json) | noaa-nwm-retrospective-2-1-zarr-pds.s3 | not-a-raster, large-chunk, zarr-v2, hydrology |
| [`tessera-global-rgb`](refused/tessera-global-rgb/collection.json) | data.source.coop | axis-order, zarr-v3, embeddings |
| [`tessera-utm30-embeddings`](refused/tessera-utm30-embeddings/collection.json) | data.source.coop | shard-spans-bands, chunk-amplification, zarr-v3, utm |

### Errors

| Collection | Host | What it tests |
| ---------- | ---- | ------------- |
| [`era5-arco-no-cors`](errors/era5-arco-no-cors/collection.json) | storage.googleapis.com | no-cors, load-error, era5, zarr-v2 |

### Client gaps

| Collection | Host | What it tests |
| ---------- | ---- | ------------- |
| [`goes-18-fdcc-icechunk`](client-gaps/goes-18-fdcc-icechunk/collection.json) | data.source.coop | client-gap, icechunk, virtual, geostationary, antimeridian |

## What the set has already shown

These are cross-cutting findings, verified against the stores above. They are
written up in full for portolan-spec#132.

**Every `zarr_conventions` schema URL in the wild returns 404.** Four stores
declare conventions, and all of them point at `refs/tags/v1`:

| Store | Declared schema URL | Status |
| ----- | ------------------- | ------ |
| italy-aerial | `zarr-conventions/multiscales` `refs/tags/v1` | 404 |
| wsf-tracker | `multiscales`, `geo-proj`, `spatial`, all `refs/tags/v1` | 404 |
| ftw-predictions | `zarr-experimental/geo-proj`, `zarr-conventions/spatial` `refs/tags/v1` | 404 |
| tessera | `geo-embeddings/embeddings-zarr-convention` `refs/tags/v1` | 404 |

The only released tag of each `zarr-conventions` convention is `v0.1`, at Pilot
maturity. The README of the multiscales convention says `v1` is expected before
the end of 2026. So publishers are declaring a version that does not exist yet,
and a validator cannot currently resolve a single one of these declarations.

**`multiscales` has three spellings in production, and the level order is not
consistent inside one of them.** The object (`layout`) form, the array
(`datasets`) form, and a paths-only form all appear here. GeoZarr 0.4 mandates
coarsest-first; the FTW store uses the array form and lists its 14 levels
finest-first. A client cannot assume either, so each level needs to declare its
own factor and shape.

**Three stores open, parse, and then cannot be indexed.** `tessera-global-rgb`
has dims `[lat, lon, band]`, so its spatial axes are not the last two.
`cbofs-ssh` and `gmgsi-icechunk` carry 2-D curvilinear coordinates. All three
are valid Zarr. None can be drawn without a per-pixel warp.

**Media types do not identify the reader.** Every Icechunk repository here is a
bare repository: one `repo` key at the store root holding the magic
`ICE<snowflake>CHUNK` and the writer version, with no `refs/` prefix. Nothing
in the asset metadata says the client needs the Icechunk library.
`goes-18-fdcc-icechunk` types itself `application/vnd.zarr; version=3`, and
`eopf-s2-l2a-v2-band` carries the malformed `application/vnd+zarr`.

**A guard is only worth having if it is free.** Across the refused stores, no
refusal transferred more than 0.6 MB. Every rule in the set is decidable from
metadata documents, which are a few kilobytes. A check that needs a chunk read
cannot report a reason, because it hangs first.

## Using it as a test matrix

The browser harness lives in portolan-browser, not here, so this repository
stays dependency-free:

```sh
# in a portolan-browser checkout, on the Zarr branch
corepack pnpm exec vite --port 8095 --strictPort &
BROWSER_URL=http://localhost:8095 \
  CATALOG_URL=https://raw.githubusercontent.com/cholmes/zarr-testbed/refs/heads/main \
  node tests/manual/zarr-wild-check.mjs
```

Two scripts here need only Node, with no dependencies:

```sh
node scripts/check-stores.mjs     # is every store still reachable? writes STATUS.md
node scripts/build-catalogs.mjs   # rebuild every catalog.json from the tree
```

[`STATUS.md`](STATUS.md) records the last liveness check: HTTP status,
`Access-Control-Allow-Origin`, which metadata document answered, and the
Icechunk writer version where there is one. A scheduled workflow re-runs it
weekly, because wild stores rot and a testbed that does not notice starts
reporting its own rot as a client defect.

## Adding a store

1. Make a directory under the tier you expect: `<tier>/<id>/collection.json`.
2. Write the collection. Describe the store from **its own metadata**, read with
   `curl`, not from a guess. Say which facts you did not confirm.
3. End the description with the expected or measured browser outcome. Say which
   it is, and date a measured one.
4. Run `node scripts/build-catalogs.mjs` to wire up the links and indexes.
5. Run `node scripts/check-stores.mjs` to confirm the store answers a browser.

Keep descriptions honest about failure. A store that refuses is as useful here
as one that draws, and a store the client gets wrong is the most useful of all.

**Wanted:** a self-hosted
[DHIS2 Open Climate Service](https://github.com/dhis2/open-climate-service)
instance, which publishes the same store as both plain Zarr and Icechunk;
a [chronozarr](https://chronozarr.org) store, which is built as a
browser-readable Zarr v3 pyramid; and any store with a 1-D rectilinear grid
whose CRS EPSG does not define.

## Scope

This set covers raster-like Zarr that a client reads from object storage and
draws on a map, with no tile server in between. It includes virtual and
transactional (Icechunk) stores because clients meet them, even though
portolan-spec#132 scopes the first profile to physical stores.

It is not a Portolan-conformant catalog and does not try to be. It has no
item mirror, no thumbnails and no styles, because it mirrors other people's
stores rather than publishing data of its own.

## License

The metadata in this repository is [CC0 1.0](LICENSE). It is a description of
other people's data.

Each store keeps its own license, recorded in its collection's `license` field
and ranging from CC0 to CC-BY-4.0 to `proprietary`. Check the `via` link before
you use any of the data.
