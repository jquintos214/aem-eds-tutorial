/**
 * loads and decorates the block
 * @param {Element} block The teaser block element
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const imageRow = rows.find((row) => row.querySelector('picture'));
  const [titleRow, descriptionRow, actionsRow] = rows.filter((row) => row !== imageRow);

  const imgWrapper = imageRow?.querySelector(':scope > div');
  if (imgWrapper) {
    imgWrapper.classList.add('teaser-img');
    const picture = imgWrapper.querySelector('picture');
    if (picture) {
      picture.classList.add('image');
      picture.querySelector('img')?.classList.add('image__image');
    }
    imageRow.replaceWith(imgWrapper);
  }

  const content = document.createElement('div');
  content.className = 'teaser-content';

  const titleCol = titleRow?.querySelector(':scope > div');
  if (titleCol) {
    titleCol.querySelector('h1, h2, h3, h4, h5, h6')?.classList.add('teaser-title');
    titleCol.querySelector(':scope > :not(h1, h2, h3, h4, h5, h6)')?.classList.add('teaser-pretitle');
    content.append(...titleCol.childNodes);
  }

  const descriptionCol = descriptionRow?.querySelector(':scope > div');
  if (descriptionCol) {
    descriptionCol.classList.add('teaser-description');
    content.append(descriptionCol);
  }

  const actionContainer = document.createElement('div');
  actionContainer.className = 'teaser-action-container';
  actionsRow?.querySelectorAll(':scope > div').forEach((col) => {
    const link = col.querySelector('a');
    if (link) {
      link.classList.add('teaser-action-link');
      actionContainer.append(link);
    }
  });
  if (actionContainer.childElementCount) {
    content.append(actionContainer);
  }

  titleRow?.remove();
  descriptionRow?.remove();
  actionsRow?.remove();

  block.append(content);
}
