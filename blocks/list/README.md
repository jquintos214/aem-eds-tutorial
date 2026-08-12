# List

## Variances (static, child pages, tagged items, search)

- Static list is native to the authoring doc — a `<ul>`/`<ol>` maps straight to markup, no data fetching, no extra plumbing. Trivial relative to the other three.
- Child pages, tagged items, and search are all the same underlying problem wearing different clothes: "how does this block get its item set." Child pages filters a query-index by path prefix, tagged items filters the same index by a tag/category column, search filters it interactively against user input. None of them are content-authoring problems anymore — they're data-fetching problems, which is a different skillset and a different risk profile than the rest of this migration so far (Teaser, Accordion) where the hard part was markup/config shape, not runtime data.
- Recommendation is one `list` block with a `type` config value and a shared "fetch item set → render item" core, since the four variants differ in *where the items come from*, not in how an item renders.

## Config rows (root, sort, order, limit, display)

- Same table-as-dialog pattern as Teaser's Actions row: key/value rows parsed into a plain object in `decorate()`, no AEM Dialog XML equivalent exists in EDS.
- `root`, `sort`, `order`, `limit` only apply to the three data-driven variants — static list ignores them because its content is already inline in the table. Worth documenting explicitly in the authoring guide, otherwise an author will set `limit` on a static list, see nothing happen, and assume the block is broken.
- `sort` needs a whitelist mapped to actual query-index columns (e.g. `date`, `title`) — if `helix-query.yaml`/`helix-query.yaml`'s index doesn't publish a given column, the sort option silently no-ops. Same class of failure as Teaser's stray-paragraph problem: a config value that looks accepted but does nothing, with no error surfaced to the author.
- `display` toggles: one row with comma/space-separated tokens (`thumbnail, excerpt, date`) parsed into a Set, rather than one row per toggle. Fewer authoring rows to get wrong, and adding a new toggle later doesn't require inventing a new row convention each time.

## CLS risk (async variants only)

- Static list is exempt — server-rendered in the initial HTML, no shift risk.
- Child pages, tagged items, and search all fetch after first render, which is the standard CLS trap: empty block renders, content pops in later, everything below it jumps. Mitigate by reserving space up front — `min-height` computed from `limit × item-height` (known at decorate-time from parsed config), dropped once real content lands.
- Item images need explicit `width`/`height` or `aspect-ratio` independent of the list-level fix, or an individual item still reflows as its own image loads even with the container pre-sized.
- Skeleton placeholder at the same dimensions beats a spinner — a spinner disappearing and being replaced by content is itself a shift; a skeleton-to-content swap at matched dimensions isn't.
- Search is a partial exception: results changing shape per keystroke is expected interactive behavior, not a passive layout shift, but the results container should still hold a min-height so content below the search block doesn't jump while the user types.
- Open question worth resolving before implementation: does the current query-index config return image dimensions per item, or would rendering a thumbnail require a second per-item fetch? If it's not already in the index, that's worse for CLS, not better, and worth fixing at the index level rather than working around in the block.