# Migration Notes

## Restricting author input on block config fields (dropdowns)

This project authors content in Google Docs / Word tables (no `component-models.json` /
Universal Editor is set up), so there's no schema layer enforcing valid values for config
rows like the `list` block's `sort`, `order`, `limit` (see `blocks/list/README.md`).

### Google Docs

- **Insert → Smart chips → Dropdown** in a table cell gives authors a fixed set of
  choices instead of free text (moved out of Building blocks in a recent Google Docs update).
- Exports as plain text in the generated HTML/markdown — purely an authoring-UX guardrail,
  not enforcement. Nothing stops the chip from being deleted and replaced with free text.

### Word / SharePoint

- Same idea via **Developer tab → Controls → Drop-Down List Content Control**, inserted
  into a table cell, with choices defined under Developer tab → Properties.
- The Developer tab is hidden by default: enable via File → Options → Customize Ribbon →
  check "Developer".
- Editing the option list requires the desktop Word app; Word Online can select from an
  existing list but isn't as reliable for redefining the choices.
- Same caveat as Google Docs: it's a UX guardrail only, not enforced server-side.

### Code-side enforcement (required either way)

Because neither Docs nor Word dropdowns are enforced once content is exported, blocks must
validate config values defensively in `decorate()` — whitelist known values and fall back
to a sane default rather than silently no-op-ing on an unrecognized value. This is already
flagged as an open risk for the `list` block's `sort` field.

### Universal Editor alternative

If a block moves to Universal Editor authoring (`component-models.json`), a `select` field
type gives real schema-enforced dropdowns — invalid values can't be entered at all, so the
code-side fallback becomes a defense-in-depth measure rather than the only safeguard:

```json
{
  "component": "select",
  "name": "order",
  "label": "Order",
  "valueType": "string",
  "options": [
    { "name": "Ascending", "value": "asc" },
    { "name": "Descending", "value": "desc" }
  ],
  "required": true
}
```

## Setting up `query-index.json` on a Google Drive–sourced site

Needed for the `list` block's `child-pages`/`tags` variants (see `blocks/list/README.md`) to
have real data to fetch. There is no `helix-query.yaml` in this project — modern EDS projects
configure indexing via the **[Index Admin Tool](https://tools.aem.live/tools/index-admin/index.html)**
or the Admin API, not a committed YAML file.

This project's index is named `main`, org `jquintos214`, site `aem-eds-tutorial`.

### Config gotcha: multi-value properties

In the Add Index form, a property configured with **Type: Multiple** (e.g. `tags`) must use the
**Select** field for its CSS selector, not **Select First**. `selectFirst` only pairs with
**Type: Single**. Mixing them fails schema validation with a 400 on save — the Admin Tools UI
only shows "Failed to save index, check console for details"; the real reason is in the
`X-Error` response header on the failed `query.yaml` request in DevTools → Network.

### Three layers that must exist before `/query-index.json` returns data

Because this site's content source is Google Drive, indexing is **spreadsheet-based**, not the
JSON-file mechanism the aem.live docs describe for BYOM/markup sources. Nothing creates these
for you — each one 404s/errors independently until it exists, and each failure was only visible
via the Log Viewer (`tools.aem.live/tools/log-viewer`, filtered to `Source = indexer`), not the
Admin Tools UI:

1. **The target spreadsheet file** — a Google Sheet named to match the index Target minus its
   extension (Target `/query-index.json` → file named `query-index`), created manually in the
   same Drive folder used as the content root. Missing this → indexer error `Unable to find
   target '/query-index' for index 'main'`.
2. **A tab named exactly `raw_index`** inside that spreadsheet — the indexer only writes to a
   tab with this literal name, not the default `Sheet1`. Missing this → `Unable to find sheet
   'raw_index' in target '/query-index'`.
3. **A header row in `raw_index`** with `path` plus one column per configured property
   (`title`, `date`, `description`, `image`, `tags` for this project's `main` index). Missing
   this → `Unable to find column 'path' in '/query-index!raw_index'`.

### Verifying it worked

- Pages only enter the index once **published** (or previewed, for the `.aem.page` preview
  index) — being present in Drive isn't enough.
- After fixing any of the three layers above, re-publish (or re-preview) the affected pages
  individually rather than relying on a bulk Reindex — a bulk reindex only refreshes pages
  already successfully in the index, and every page hit by an earlier error was never
  successfully indexed in the first place.
- To check a single page's indexed record directly, without waiting on the aggregate file:
  `https://admin.hlx.page/index/<org>/<site>/<branch>/<path>`.
- `title`/`description`/`image` are pulled from `og:title`/`description`/`og:image` meta tags —
  confirm a page actually has distinct authored metadata (not the site-default fallback) before
  assuming a "successful" index entry is actually useful data.
