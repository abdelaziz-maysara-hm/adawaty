import { escapeHtml, escapeAttr, safeUrl, safeImageDataUrl } from '../render-utils.js';

function renderVisual(content) {
    const safeImage = safeImageDataUrl(content.imageDataUrl);
    return safeImage
        ? `<img class="hero-visual" src="${escapeAttr(safeImage)}" alt="${escapeAttr(content.imageAlt || '')}">`
        : '<div class="hero-visual" aria-hidden="true"></div>';
}

function renderButtons(content) {
    const primary = content.primaryButtonLabel
        ? `<a class="button button-primary" href="${safeUrl(content.primaryButtonHref)}">${escapeHtml(content.primaryButtonLabel)}</a>`
        : '';
    const secondary = content.secondaryButtonLabel
        ? `<a class="button button-secondary" href="${safeUrl(content.secondaryButtonHref)}">${escapeHtml(content.secondaryButtonLabel)}</a>`
        : '';
    return `${primary}${secondary}`;
}

/** variant "split": headline/text on one side, an illustrative placeholder panel on the other. */
function renderSplitHero(section) {
    const { content } = section;
    return `<section class="hero hero-split" id="${escapeHtml(section.id)}">
  <div class="hero-inner">
    <div class="hero-copy">
      <h1>${escapeHtml(content.headline || '')}</h1>
      <p class="hero-subheadline">${escapeHtml(content.subheadline || '')}</p>
      <div class="hero-actions">${renderButtons(content)}</div>
    </div>
    ${renderVisual(content)}
  </div>
</section>`;
}

/** variant "centered": everything center-aligned, no side visual -- good for landing pages. */
function renderCenteredHero(section) {
    const { content } = section;
    return `<section class="hero hero-centered" id="${escapeHtml(section.id)}">
  <div class="hero-inner">
    <h1>${escapeHtml(content.headline || '')}</h1>
    <p class="hero-subheadline">${escapeHtml(content.subheadline || '')}</p>
    <div class="hero-actions">${renderButtons(content)}</div>
  </div>
</section>`;
}

function renderHero(section) {
    return section.variant === 'centered' ? renderCenteredHero(section) : renderSplitHero(section);
}

export { renderHero };

// END OF FILE
