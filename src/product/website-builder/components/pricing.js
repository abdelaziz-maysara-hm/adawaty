import { escapeHtml, safeUrl } from '../render-utils.js';

function renderPlanCard(plan) {
    const features = Array.isArray(plan.features) ? plan.features : [];
    const featuresHtml = features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('');
    const highlightClass = plan.highlighted ? ' plan-highlighted' : '';
    const buttonHtml = plan.buttonLabel
        ? `<a class="button button-primary" href="${safeUrl(plan.buttonHref)}">${escapeHtml(plan.buttonLabel)}</a>`
        : '';

    return `<li class="plan-card${highlightClass}">
      <h3>${escapeHtml(plan.name || '')}</h3>
      <p class="plan-price">${escapeHtml(plan.price || '')}${plan.period ? `<span class="plan-period">/${escapeHtml(plan.period)}</span>` : ''}</p>
      <ul class="plan-features">${featuresHtml}</ul>
      ${buttonHtml}
    </li>`;
}

function renderPricing(section) {
    const { content } = section;
    const plans = Array.isArray(content.plans) ? content.plans : [];

    return `<section class="pricing" id="${escapeHtml(section.id)}">
  <div class="section-inner">
    ${content.title ? `<h2>${escapeHtml(content.title)}</h2>` : ''}
    ${content.subtitle ? `<p class="section-subtitle">${escapeHtml(content.subtitle)}</p>` : ''}
    <ul class="plan-list">${plans.map(renderPlanCard).join('')}</ul>
  </div>
</section>`;
}

export { renderPricing };

// END OF FILE
