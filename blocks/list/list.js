import { createOptimizedPicture } from '../../scripts/aem.js';

const SORT_COLUMNS = new Set(['title', 'date']);
const DEFAULT_SORT = 'title';
const DEFAULT_ORDER = 'asc';
const DEFAULT_LIMIT = 10;
const DEFAULT_CHILD_DEPTH = 1;
// approximate rendered item height, used to reserve space and avoid CLS while the index loads
const ITEM_HEIGHT_PX = 96;

function parseConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const [keyCol, valueCol] = row.children;
    const key = keyCol?.textContent.trim().toLowerCase().replace(/\s+/g, '-');
    if (key) config[key] = valueCol?.textContent.trim() || '';
  });
  return config;
}

function parseSort(value) {
  const normalized = value.trim().toLowerCase();
  return SORT_COLUMNS.has(normalized) ? normalized : DEFAULT_SORT;
}

function parseOrder(value) {
  return value.trim().toLowerCase().startsWith('desc') ? 'desc' : DEFAULT_ORDER;
}

function parseLimit(value) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? DEFAULT_LIMIT : parsed;
}

function parseChildDepth(value) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? DEFAULT_CHILD_DEPTH : parsed;
}

function parseTags(value) {
  return value.split(/[,;]/).map((tag) => tag.trim().toLowerCase()).filter(Boolean);
}

// query-index delivers multi-value columns as a JSON-encoded array string, e.g. '["a","b"]'
function parseItemTags(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}

function resolveRoot(config) {
  return config.root?.trim() || window.location.pathname;
}

async function fetchIndex() {
  const resp = await fetch('/query-index.json?limit=10000');
  if (!resp.ok) return [];
  const json = await resp.json();
  return json.data || [];
}

function isWithinDepth(path, root, depth) {
  if (!path.startsWith(root)) return false;
  const segments = path.slice(root.length).split('/').filter(Boolean);
  return segments.length > 0 && segments.length <= depth;
}

function matchesTags(itemTags, tags, matchAll) {
  if (!tags.length) return true;
  return matchAll
    ? tags.every((tag) => itemTags.includes(tag))
    : tags.some((tag) => itemTags.includes(tag));
}

function filterChildPages(items, config) {
  const root = resolveRoot(config);
  const depth = parseChildDepth(config['child-depth']);
  return items.filter((item) => isWithinDepth(item.path, root, depth));
}

function filterTags(items, config) {
  const root = resolveRoot(config);
  const tags = parseTags(config.tags || '');
  const matchAll = (config.match || '').trim().toLowerCase().startsWith('all');
  return items.filter((item) => {
    if (item.path === root || !item.path.startsWith(root)) return false;
    return matchesTags(parseItemTags(item.tags), tags, matchAll);
  });
}

function sortItems(items, sort, order) {
  const sorted = [...items].sort((a, b) => (a[sort] || '').toLowerCase()
    .localeCompare((b[sort] || '').toLowerCase()));
  if (order === 'desc') sorted.reverse();
  return sorted;
}

function renderItem(item) {
  const li = document.createElement('li');
  li.className = 'list-item';

  if (item.image) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'list-item-image';
    imageWrapper.append(createOptimizedPicture(item.image, item.title || '', false, [{ width: '400' }]));
    li.append(imageWrapper);
  }

  const body = document.createElement('div');
  body.className = 'list-item-body';

  const title = document.createElement('p');
  title.className = 'list-item-title';
  const titleLink = document.createElement('a');
  titleLink.className = 'list-item-title-link';
  titleLink.href = item.path;
  titleLink.textContent = item.title || item.path;
  title.append(titleLink);
  body.append(title);

  if (item.description) {
    const description = document.createElement('p');
    description.className = 'list-item-description';
    description.textContent = item.description;
    body.append(description);
  }

  li.append(body);
  return li;
}

export default async function decorate(block) {
  const config = parseConfig(block);
  const isTagsVariant = 'tags' in config;
  const sort = parseSort(config.sort || '');
  const order = parseOrder(config.order || '');
  const limit = parseLimit(config.limit);

  block.innerHTML = '';
  block.style.minHeight = `${limit * ITEM_HEIGHT_PX}px`;

  const ul = document.createElement('ul');
  ul.className = 'list';
  block.append(ul);

  const items = await fetchIndex();
  const filtered = isTagsVariant ? filterTags(items, config) : filterChildPages(items, config);
  const sorted = sortItems(filtered, sort, order).slice(0, limit);

  sorted.forEach((item) => ul.append(renderItem(item)));
  block.style.minHeight = '';
}
