import { escapeHtml, escapeAttr, safeUrl, safeImageDataUrl } from '../render-utils.js';

/**
 * Gallery items reference images either as a real uploaded data URL
 * (validated via safeImageDataUrl -- raster formats only, since SVG data
 * URLs can carry executable content) or, if none was uploaded, fall back
 * to a labeled placeholder tile. An item can also optionally link out to
 * an external URL (e.g. a live case study or an external portfolio
 * piece) -- if `item.href` is set, the whole tile becomes a link;
 * otherwise it renders as a plain, non-interactive tile.
 */
function renderGalleryItem(item) {
    const safeImage = safeImageDataUrl(item.imageDataUrl);
    const visual = safeImage
        ? `<img class="gallery-placeholder" src="${escapeAttr(safeImage)}" alt="${escapeAttr(item.caption || '')}">`
        : `<div class="gallery-placeholder" role="img" aria-label="${escapeAttr(item.caption || '')}"></div>`;
    const captionHtml = item.caption ? `<span class="gallery-caption">${escapeHtml(item.caption)}</span>` : '';

    const inner = `${visual}\n      ${captionHtml}`;
    const content = item.href
        ? `<a class="gallery-link" href="${safeUrl(item.href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
        : inner;

    return `<li class="gallery-item">
      ${content}
    </li>`;
}

function renderGallery(section) {
    const { content } = section;
    const items = Array.isArray(content.items) ? content.items : [];

    return `<section class="gallery" id="${escapeHtml(section.id)}">
  <div class="section-inner">
    ${content.title ? `<h2>${escapeHtml(content.title)}</h2>` : ''}
    <ul class="gallery-grid">${items.map(renderGalleryItem).join('')}</ul>
  </div>
</section>`;
}

export { renderGallery };

// END OF FILE
