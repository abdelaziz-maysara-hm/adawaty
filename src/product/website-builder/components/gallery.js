import { escapeHtml, escapeAttr, safeImageDataUrl } from '../render-utils.js';

/**
 * Gallery items reference images either as a real uploaded data URL
 * (validated via safeImageDataUrl -- raster formats only, since SVG data
 * URLs can carry executable content) or, if none was uploaded, fall back
 * to a labeled placeholder tile.
 */
function renderGalleryItem(item) {
    const safeImage = safeImageDataUrl(item.imageDataUrl);
    const visual = safeImage
        ? `<img class="gallery-placeholder" src="${escapeAttr(safeImage)}" alt="${escapeAttr(item.caption || '')}">`
        : `<div class="gallery-placeholder" role="img" aria-label="${escapeAttr(item.caption || '')}"></div>`;

    return `<li class="gallery-item">
      ${visual}
      ${item.caption ? `<span class="gallery-caption">${escapeHtml(item.caption)}</span>` : ''}
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
