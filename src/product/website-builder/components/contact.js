import { escapeHtml, safeUrl } from '../render-utils.js';

function renderInfoList(content, language) {
    const rows = [];
    if (content.email) {
        rows.push(`<li><span class="contact-label">${language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span><a href="${safeUrl(`mailto:${content.email}`)}">${escapeHtml(content.email)}</a></li>`);
    }
    if (content.phone) {
        rows.push(`<li><span class="contact-label">${language === 'ar' ? 'الهاتف' : 'Phone'}</span><a href="${safeUrl(`tel:${content.phone.replaceAll(/\s+/g, '')}`)}">${escapeHtml(content.phone)}</a></li>`);
    }
    if (content.address) {
        rows.push(`<li><span class="contact-label">${language === 'ar' ? 'العنوان' : 'Address'}</span><span>${escapeHtml(content.address)}</span></li>`);
    }
    return rows.length > 0 ? `<ul class="contact-info">${rows.join('')}</ul>` : '';
}

/**
 * The generated contact form is intentionally demo-only: static sites have
 * nowhere to send a submission. `data-demo-form` is picked up by the
 * exported site's own main.js (see engine.js) to show a friendly message
 * on submit instead of pretending data was sent anywhere -- no third-party
 * form service, no fake backend.
 */
function renderDemoForm(language) {
    const t = (ar, en) => (language === 'ar' ? ar : en);
    return `<form class="contact-form" data-demo-form novalidate>
      <p class="contact-form-note">${t('نموذج تجريبي — لا يتم إرسال البيانات لأي خادم.', 'Demo form \u2014 no data is sent anywhere.')}</p>
      <label>${t('الاسم', 'Name')}<input type="text" name="name" autocomplete="name" required></label>
      <label>${t('البريد الإلكتروني', 'Email')}<input type="email" name="email" autocomplete="email" required></label>
      <label>${t('الرسالة', 'Message')}<textarea name="message" rows="5" required></textarea></label>
      <button class="button button-primary" type="submit">${t('إرسال', 'Send')}</button>
      <p class="contact-form-result" data-demo-form-result hidden></p>
    </form>`;
}

function renderContact(section, spec) {
    const { content } = section;
    const language = spec.site.language;
    const showForm = content.showForm !== false;

    return `<section class="contact" id="${escapeHtml(section.id)}">
  <div class="section-inner contact-inner">
    <div class="contact-copy">
      <h2>${escapeHtml(content.title || '')}</h2>
      ${content.subtitle ? `<p class="section-subtitle">${escapeHtml(content.subtitle)}</p>` : ''}
      ${renderInfoList(content, language)}
    </div>
    ${showForm ? `<div class="contact-form-wrap">${renderDemoForm(language)}</div>` : ''}
  </div>
</section>`;
}

export { renderContact };

// END OF FILE
