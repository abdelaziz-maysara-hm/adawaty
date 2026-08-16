import { escapeHtml, escapeAttr, safeImageDataUrl } from '../render-utils.js';

function renderVisual(content) {
    const safeImage = safeImageDataUrl(content.imageDataUrl);
    return safeImage
        ? `<img class="about-visual" src="${escapeAttr(safeImage)}" alt="${escapeAttr(content.imageAlt || '')}">`
        : '<div class="about-visual" aria-hidden="true"></div>';
}

function renderAbout(section) {
    const { content } = section;
    const paragraphs = Array.isArray(content.paragraphs) ? content.paragraphs : [];
    const paragraphsHtml = paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');

    return `<section class="about" id="${escapeHtml(section.id)}">
  <div class="section-inner about-inner">
    <div class="about-copy">
      <h2>${escapeHtml(content.title || '')}</h2>
      ${paragraphsHtml}
    </div>
    ${renderVisual(content)}
  </div>
</section>`;
}

export { renderAbout };

// END OF FILE
