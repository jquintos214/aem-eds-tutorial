# List

## Variances (static, child pages, tags)

- Static list is native to the authoring doc — a `<ul>`/`<ol>` maps straight to markup, no data fetching, no extra plumbing. Trivial relative to the other two.
- **Decision: two library variants, not one block with a `type` row.** `List (child-pages)` and `List (tags)` are separate Sidekick Library entries, each shipping only the config rows relevant to that data source. An author drops the variant they want and never sees a field that doesn't apply to it — no `type` row to set correctly first, no silent no-op risk from an irrelevant field sitting in the table. Both variants share one `decorate()`/render core (fetch item set → render item); only the config-parsing and query-index filter differ.
- **Search is out of scope for now** — deferred, not designed against. Revisit variances/CLS notes below if it gets picked back up.
- Child pages filters the query-index by `root` path-prefix (optionally bounded by `child-depth`); tags filters the same index by a tag column matched against `tags`. Both are data-fetching problems, a different risk profile than Teaser/Accordion where the hard part was markup/config shape, not runtime data.

## Config rows

### List (child-pages)

`root`, `child-depth`, `sort`, `order`, `limit`.

- `child-depth` isn't a query-index column — query-index only supports the `root` path-prefix filter, so depth is applied client-side after fetch by counting path segments below `root`. Default to `1` (direct children only) to avoid an unbounded fetch under a root with deep nesting.
- Decide now whether `child-depth` filtering happens before or after `limit` — if depth-filtering runs client-side after the query-index fetch, a `limit: 10` can silently return fewer than 10 items once depth excludes some. Document this, don't let an author discover it by trial and error.

### List (tags)

`root`, `tags`, `match`, `sort`, `order`, `limit`.

- `match` (`Any tag` / `All tags` per the screenshot) decides whether `tags` is OR'd or AND'd against the index's tag column.

### Shared across both variants

- Same table-as-dialog pattern as Teaser's Actions row: key/value rows parsed into a plain object in `decorate()`, no AEM Dialog XML equivalent exists in EDS.
- `sort` and `order` are Smart Chip dropdowns (Insert → Smart chips → Dropdown in Google Docs; Developer tab → Drop-Down List Content Control in Word/SharePoint) so authors pick from a fixed list instead of typing free text — see `docs/migration-notes.md`. That's a UX guardrail only, not enforcement: `decorate()` still needs to whitelist `sort` against actual query-index columns (e.g. `date`, `title`) and fall back to a default rather than silently no-op if the index (configured via the [Index Admin Tool](https://tools.aem.live/tools/index-admin/index.html) / Admin API, not a committed `helix-query.yaml`) doesn't publish a given column. Same class of failure as Teaser's stray-paragraph problem — a value that looks accepted but does nothing, with no error surfaced to the author.
- `display` toggles (if/when added): one row with comma/space-separated tokens (`thumbnail, excerpt, date`) parsed into a Set, rather than one row per toggle.

## CLS risk (async variants only)

- Static list is exempt — server-rendered in the initial HTML, no shift risk.
- Child pages and tags both fetch after first render, which is the standard CLS trap: empty block renders, content pops in later, everything below it jumps. Mitigate by reserving space up front — `min-height` computed from `limit × item-height` (known at decorate-time from parsed config), dropped once real content lands.
- Item images need explicit `width`/`height` or `aspect-ratio` independent of the list-level fix, or an individual item still reflows as its own image loads even with the container pre-sized.
- Skeleton placeholder at the same dimensions beats a spinner — a spinner disappearing and being replaced by content is itself a shift; a skeleton-to-content swap at matched dimensions isn't.
- Open question worth resolving before implementation: does the current query-index config return image dimensions per item, or would rendering a thumbnail require a second per-item fetch? If it's not already in the index, that's worse for CLS, not better, and worth fixing at the index level rather than working around in the block.