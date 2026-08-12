# Accordion

## Fixed content contract (heading + rich text)

- Lost: dropping any block into a panel — Hero, Teaser, Cards, embeds, multi-column layouts. Authors get bold/links/lists/inline images via the RTE, nothing composed.
- Does it matter: depends entirely on what panels are actually for. If this is FAQ/support-style Q&A, it's fine — most accordions never need more than rich text. It does matter here specifically, though: the content you're testing against already has a Hero nested in a panel, which is a real signal the author wants composed blocks inside panels, not just text.

## Nested blocks (table in a table cell)

- Lost: almost nothing content-wise — full block palette works inside panels, same authoring gesture as everywhere else in the doc.
- What it actually costs is on your side, not the author's: we just proved the content pipeline only auto-converts top-level tables into block markup, so every container block that wants to allow nesting (accordion, tabs, columns…) has to hand-roll table→block conversion and manually call decorateBlock/loadBlock. It's also fragile in ways that don't show up until content changes shape: decorateBlock's section.closest('.section') call finds the page section, not a scope local to the accordion item, so ${blockName}-container classes and any section-metadata-driven styling can leak or apply at the wrong level. And in the authoring doc itself, tables nested inside table cells are easy for a non-technical author to mangle (merged cells, paste-from-Word artifacts).
Does it matter: matters to you as the implementer more than to the author. Worth it only if there's a real, recurring need for composed content in panels — not a one-off.

## Section-based (section breaks + section-metadata instead of a block table)

- Lost: the accordion stops being a portable, droppable block. Sections are top-level page structure, so this can't be nested inside a column layout, another block, or reused as "just one part of the page" — it has to own full-width sections of the document. Authors also lose the "insert block → fill a table" gesture in favor of typing --- breaks and filling a metadata table per section, which is less discoverable and easy to get out of order when reordering/duplicating items (you're moving whole sections, not rows).
- Gains full content generality per panel without the nested-table hack, since panel content is just normal top-level content in that section.
- Does it matter: matters most if you ever need more than one accordion on a page, or an accordion as a sub-element of a richer layout — section-based rules that out entirely.

Recommendation: given the current <details>/<summary> implementation already commits to "content in the cell is whatever's authored" rather than a fixed schema, and given you're already exercising the nested-hero case, I'd lean toward nested blocks — but only if you're willing to generalize the table→block conversion you just wrote into a small shared helper (e.g. in scripts.js) rather than reimplementing it per container block. If that engineering cost isn't worth it right now, fixed content contract is the pragmatic fallback — you can always graduate to nested blocks later if a real content need shows up, since it doesn't foreclose anything for authors, it just makes them wait.

## Config rows (multi-open, default open)

- Different category from List's config: List's rows drive *data fetching* (which items, how many); anything accordion needs would drive *behavior* (how panels interact), and native `<details>`/`<summary>` already covers most of that for free.
- Multiple panels open at once is the default `<details>` behavior with zero code — each panel toggles independently. If the intent is classic single-open accordion behavior instead, that requires real implementation (JS listening for the `toggle` event, closing sibling panels), and *that's* the one genuine candidate for a config row — e.g. `multi-open: false` — since it's a real behavioral choice, not something free from the browser.
- Default open panel doesn't need a config row at all: it's expressible directly in the authored content (`<details open>`, or a marker in the panel's heading cell) the same way heading level is expressible by just typing `#`/`##` in the source doc — no side-channel config needed for something the content itself can carry.
- Icon/chevron styling and open/close animation belong in `accordion.css`, not authoring config — they're design-system decisions applied uniformly, not per-instance choices an author should be making.
- Net: accordion doesn't need a config table the way List does. If anything, one optional row (`multi-open`) — not a general config contract.