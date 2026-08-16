import { escapeHtml } from '../render-utils.js';

function renderFeatureCard(item) {
    return `<li class="feature-card">
      <span class="feature-icon" aria-hidden="true">${escapeHtml(item.icon || '★')}</span>
      <h3>${escapeHtml(item.title || '')}</h3>
      <p>${escapeHtml(item.description || '')}</p>
    </li>`;
}

/** variant "grid": a uniform card grid, the most common layout. */
function renderGridFeatures(section) {
    const { content } = section;
    const items = Array.isArray(content.items) ? content.items : [];
    return `<section class="features features-grid" id="${escapeHtml(section.id)}">
  <div class="section-inner">
    <h2>${escapeHtml(content.title || '')}</h2>
    ${content.subtitle ? `<p class="section-subtitle">${escapeHtml(content.subtitle)}</p>` : ''}
    <ul class="feature-list">${items.map(renderFeatureCard).join('')}</ul>
  </div>
</section>`;
}

/** variant "list": a simpler vertical list, useful for denser or more text-heavy content. */
function renderListFeatures(section) {
    const { content } = section;
    const items = Array.isArray(content.items) ? content.items : [];
    const rows = items.map((item) => `<li class="feature-row">
      <span class="feature-icon" aria-hidden="true">${escapeHtml(item.icon || '•')}</span>
      <div><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.description || '')}</p></div>
    </li>`).join('');

    return `<section class="features features-list" id="${escapeHtml(section.id)}">
  <div class="section-inner">
    <h2>${escapeHtml(content.title || '')}</h2>
    ${content.subtitle ? `<p class="section-subtitle">${escapeHtml(content.subtitle)}</p>` : ''}
    <ul class="feature-rows">${rows}</ul>
  </div>
</section>`;
}

function renderFeatures(section) {
    return section.variant === 'list' ? renderListFeatures(section) : renderGridFeatures(section);
}

export { renderFeatures };

// END OF FILE
