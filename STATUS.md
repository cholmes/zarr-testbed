# Store status

Checked 2026-11-06 by `node scripts/check-stores.mjs`.

This table says whether each store answers a browser, not whether it draws.
A store in the `errors` tier is expected to send no CORS header.

| Tier | Collection | Asset | Status | Access-Control-Allow-Origin | Document read | Writer |
| ---- | ---------- | ----- | ------ | --------------------------- | ------------- | ------ |
| errors | era5-arco-no-cors | `data` | 200 | `(none)` | `.zmetadata` |  |
| held-back | carbonplan-v1-2d-tavg | `data` | 200 | `*` | `.zmetadata` |  |
| held-back | ctrees-agb-icechunk | `data` | 200 | `*` | `repo` | `ic-2.3.0-alpha.1` |
| held-back | ftw-features-composites | `data` | 200 | `*` | `zarr.json` |  |
| held-back | mur-sst | `data` | 200 | `*` | `.zmetadata` |  |
| pending | goes-18-fdcc-icechunk | `icechunk` | 200 | `*` | `repo` | `ic-2.3.0` |
| pending | noaa-hrrr-analysis | `icechunk-https` | 200 | `*` | `repo` | `ic-2.3.1` |
| refused | carbonplan-4d-climate | `data` | 200 | `*` | `.zmetadata` |  |
| refused | cbofs-ssh | `data` | 200 | `*` | `zarr.json` |  |
| refused | cmip6-gfdl-tas | `data` | 200 | `*` | `.zmetadata` |  |
| refused | dynamical-gfs-analysis | `icechunk-https` | 200 | `*` | `repo` | `ic-2.3.1` |
| refused | dynamical-gfs-virtual-gribberish | `icechunk-https` | 200 | `*` | `repo` | `ic-2.3.1` |
| refused | eopf-s2-l2a-v2-band | `SR_10m` | 200 | `*` | `.zgroup` |  |
| refused | gmgsi-icechunk | `data` | 200 | `*` | `repo` | `ic-2.2.2` |
| refused | its-live-velocity | `data` | 200 | `*` | `.zmetadata` |  |
| refused | noaa-gefs-analysis | `data` | 200 | `*` | `zarr.json` |  |
| refused | nwm-streamflow | `data` | 200 | `*` | `.zmetadata` |  |
| refused | tessera-global-rgb | `data` | 200 | `*` | `zarr.json` |  |
| refused | tessera-utm30-embeddings | `data` | 200 | `*` | `zarr.json` |  |
| renders | carbonplan-2d-tavg | `data` | 200 | `*` | `.zgroup` |  |
| renders | carbonplan-3d-tavg-prec | `data` | 200 | `*` | `.zmetadata` |  |
| renders | carbonplan-v2-2d-tavg | `data` | 200 | `*` | `.zmetadata` |  |
| renders | eopf-s2-l2a-zarr3 | `reflectance` | 200 | `*` | `zarr.json` |  |
| renders | ftw-predictions-zarr | `data` | 200 | `*` | `zarr.json` |  |
| renders | italy-aerial-ortho | `data` | 200 | `*` | `zarr.json` |  |
| renders | nasa-rasi-icechunk-virtual | `data` | 200 | `*` | `refs/branch.main/ref.json` |  |
| renders | tessera-life-biodiversity | `data` | 200 | `*` | `zarr.json` |  |
| renders | wsf-tracker | `data` | 200 | `*` | `zarr.json` |  |

28 store assets checked. 0 unreachable.
