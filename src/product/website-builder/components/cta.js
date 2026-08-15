import { escapeHtml, safeUrl } from '../render-utils.js';

function renderCta(section) {
    const { content } = section;
    const buttonHtml = content.buttonLabel
        ? `<a class="button button-primary" href="${safeUrl(content.buttonHref)}">${escapeHtml(content.buttonLabel)}</a>`
        : '';

    return `<section class="cta" id="${escapeHtml(section.id)}">
  <div class="section-inner cta-inner">
    <h2>${escapeHtml(content.title || '')}</h2>
    ${content.subtitle ? `<p>${escapeHtml(content.subtitle)}</p>` : ''}
    ${buttonHtml}
  </div>
</section>`;
}

export { renderCta };

// END OF FILE
