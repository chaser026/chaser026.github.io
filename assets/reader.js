const params = new URLSearchParams(location.search);
const site = window.SITE || { site: {}, documents: [] };
const meta = site.site || {};
const item = (site.documents || []).find(d => d.id === params.get('id'));
const root = document.querySelector('#reader');

// Site chrome
if (meta.title) document.querySelectorAll('[data-site-title]').forEach(el => el.textContent = meta.title);
if (meta.tagline) document.querySelectorAll('[data-site-tagline]').forEach(el => el.textContent = meta.tagline);
if (meta.github) document.querySelectorAll('[data-github]').forEach(el => el.href = meta.github);
if (meta.author) {
  const year = new Date().getFullYear();
  document.querySelectorAll('[data-copyright]').forEach(el => el.textContent = `© ${year} ${meta.author}`);
}

function escapeHtml(v = '') {
  return v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}

const CALLOUT_MAP = {
  NOTE: { cls: 'callout-blue', label: '提示' },
  TIP: { cls: 'callout-green', label: '技巧' },
  IMPORTANT: { cls: 'callout-purple', label: '重点' },
  WARNING: { cls: 'callout-amber', label: '注意' },
  CAUTION: { cls: 'callout-red', label: '警告' },
};

// Convert GitHub-style callouts (> [!NOTE]) into styled divs.
function transformCallouts(container) {
  container.querySelectorAll('blockquote').forEach(bq => {
    const firstText = (bq.textContent || '').trimStart();
    const m = firstText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
    if (!m) return;
    const type = m[1].toUpperCase();
    const conf = CALLOUT_MAP[type] || CALLOUT_MAP.NOTE;
    // Remove the [!TYPE] marker from the first element
    const walker = bq.querySelector('p') || bq;
    walker.innerHTML = walker.innerHTML.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(<br\s*\/?>)?/i, '');
    const div = document.createElement('div');
    div.className = `callout ${conf.cls}`;
    div.innerHTML = `<span class="callout-tag">${conf.label}</span><div class="callout-body">${bq.innerHTML}</div>`;
    bq.replaceWith(div);
  });
}

function buildToc(container) {
  const heads = [...container.querySelectorAll('h2, h3')];
  if (heads.length < 3) return '';
  let idx = 0;
  const links = heads.map(h => {
    const id = `h-${idx++}`;
    h.id = id;
    const lvl = h.tagName === 'H2' ? 2 : 3;
    return `<a href="#${id}" class="toc-l${lvl}">${escapeHtml(h.textContent)}</a>`;
  }).join('');
  return `<nav class="reader-toc"><span>目录</span>${links}</nav>`;
}

if (!item) {
  root.innerHTML = '<div class="empty-state">文档不存在或链接已失效。</div>';
} else {
  marked.setOptions({ gfm: true, breaks: false });

  const article = document.createElement('article');
  article.className = 'reader-content';
  article.innerHTML = marked.parse(item.markdown || '');

  // Syntax highlighting
  article.querySelectorAll('pre code').forEach(block => {
    try { hljs.highlightElement(block); } catch (e) { /* ignore */ }
  });

  // Callouts
  transformCallouts(article);

  // TOC (built after headings exist)
  const tocHtml = buildToc(article);

  root.innerHTML = `
    <header class="reader-header">
      <p class="eyebrow">${escapeHtml(item.project)} · ${escapeHtml(item.assignment)} / ${escapeHtml(item.module)}</p>
      <h1>${escapeHtml(item.title)}</h1>
      <p class="reader-sub">${escapeHtml(item.chapter && item.chapter !== '概述' ? item.chapter : item.module)}</p>
    </header>
    <div class="reading-progress"><i></i></div>
    <div class="reading-layout">
      <aside class="reading-aside">${tocHtml}</aside>
    </div>`;
  root.querySelector('.reading-layout').appendChild(article);

  // KaTeX math
  if (window.renderMathInElement) {
    renderMathInElement(article, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
    });
  }

  const bar = document.querySelector('.reading-progress i');
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? `${Math.min(100, (window.scrollY / max) * 100)}%` : '100%';
  });

  // Comments (Twikoo)
  mountComments();
}

function mountComments() {
  const article = document.querySelector('.reader-content');
  if (!article) return;

  const section = document.createElement('section');
  section.className = 'comments-section';
  section.innerHTML = '<h2 class="comments-title">评论</h2>';
  article.after(section);

  const t = (site.site && site.site.twikoo) || {};
  if (!t.enabled || /填入|部署后/.test(t.envId || '')) {
    section.insertAdjacentHTML('beforeend',
      '<p class="comments-hint">评论功能尚未配置：在 <code>content/projects.json</code> 的 <code>site.twikoo</code> 中填入后端地址并将 <code>enabled</code> 设为 <code>true</code>。</p>');
    return;
  }
  if (!window.twikoo) {
    section.insertAdjacentHTML('beforeend',
      '<p class="comments-hint">评论组件加载失败（CDN 网络波动），刷新页面试试。</p>');
    return;
  }
  section.insertAdjacentHTML('beforeend', '<div id="tcomment"></div>');
  const opt = { envId: t.envId, el: '#tcomment', lang: t.lang || 'zh-CN', path: 'reader' + location.search };
  if (t.region) opt.region = t.region;
  twikoo.init(opt);
}
