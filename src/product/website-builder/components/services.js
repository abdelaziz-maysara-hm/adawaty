import { escapeHtml, safeUrl } from '../render-utils.js';

function renderServiceCard(item) {
    const linkHtml = item.linkLabel
        ? `<a class="service-link" href="${safeUrl(item.linkHref)}">${escapeHtml(item.linkLabel)}</a>`
        : '';
    return `<li class="service-card">
      <span class="service-icon" aria-hidden="true">${escapeHtml(item.icon || '◆')}</span>
      <h3>${escapeHtml(item.title || '')}</h3>
      <p>${escapeHtml(item.description || '')}</p>
      ${linkHtml}
    </li>`;
}

function renderServices(section) {
    const { content } = section;
    const items = Array.isArray(content.items) ? content.items : [];

    return `<section class="services" id="${escapeHtml(section.id)}">
  <div class="section-inner">
    <h2>${escapeHtml(content.title || '')}</h2>
    ${content.subtitle ? `<p class="section-subtitle">${escapeHtml(content.subtitle)}</p>` : ''}
    <ul class="service-list">${items.map(renderServiceCard).join('')}</ul>
  </div>
</section>`;
}

export { renderServices };

// END OF FILE
