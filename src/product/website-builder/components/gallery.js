import { escapeHtml, escapeAttr } from '../render-utils.js';

/**
 * Gallery items reference images by a caption/placeholder color only in
 * V1 -- there is no image upload pipeline yet, so each item renders as a
 * labeled placeholder tile rather than an <img> pointing at a URL a user
 * typed in (which would otherwise need its own URL-safety handling).
 */
function renderGalleryItem(item) {
    return `<li class="gallery-item">
      <div class="gallery-placeholder" role="img" aria-label="${escapeAttr(item.caption || '')}"></div>
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
