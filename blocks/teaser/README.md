# Teaser

## Multiple CTAs (multifield → table)

- Table equivalent: the Actions row, with one column per CTA - each authored as a `<p><a href="...">Label</a></p>` in its own cell.
- `decorate()` doesn't distinguish "two CTAs" from "one CTA and a stray paragraph" by any semantic rule. It iterates every column in the actions row and keeps a column only if it contains an anchor (`col.querySelector('a')`). A stray paragraph with no link is silently dropped - the content is lost with no warning. A stray paragraph that happens to contain a link gets silently promoted to a third CTA. The "field" is inferred purely from shape (does this cell have a link in it?), never from authored intent.

## Optional fields (blank dialog field vs. missing table row)

- Rows are destructured positionally: `const [imageRow, titleRow, descriptionRow, actionsRow] = block.querySelectorAll(':scope > div')`. That's an index contract, not a named one.
- If an author omits the description row entirely, everything below it shifts up one slot - the real actions row gets bound into the `descriptionRow` variable, and the block never sees the actual actions row at all. The block has no way to tell "no description" from "description landed in the wrong slot," because it never inspects *what* a row contains, only *where* it sits in the list.
- Core Components didn't have this failure mode: a blank dialog field is a named, absent JCR property regardless of authoring order. The table format has no equivalent guarantee unless the block explicitly identifies rows by content/shape instead of trusting position - this one doesn't yet.

## Heading level (policy → ?)

- Old model: the title's heading level was constrained to a set the component policy allowed, with a policy default when unset. The policy was owned centrally (design-system/front-end lead) and enforced on every instance sitewide.
- New model: `decorate()` just takes whatever heading tag is already in the authored markup (h1-h6) and adds a class to it - it doesn't choose or constrain the level. The decision now lives entirely with the author, per-instance, the moment they type `#`/`##`/etc. in the source doc. There's no enforcement and no default: if the author uses plain text with no heading at all, the title never gets the `teaser__title` class or its styling.
- Nobody owns this structurally anymore. If that governance still matters - avoiding skipped heading levels for accessibility, or a design system that only wants h2/h3 for teasers - it has to be re-added deliberately: either as an authoring guideline documented outside the code, or as logic in `decorate()` that clamps or defaults the heading level instead of trusting the source doc verbatim.