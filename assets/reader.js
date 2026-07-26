const params = new URLSearchParams(location.search);
const item = (window.BLOG_DOCUMENTS || []).find(doc => doc.id === params.get('id'));
const root = document.querySelector('#reader');

function escapeHtml(value = '') {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function inlineMarkup(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function renderDocument(text = '') {
  const blocks = text.split(/\n{2,}/).map(block => block.trim()).filter(Boolean);
  let html = '';
  let list = [];
  let inCode = false;
  let code = [];

  const flushList = () => {
    if (!list.length) return;
    html += `<ul>${list.map(item => `<li>${inlineMarkup(item)}</li>`).join('')}</ul>`;
    list = [];
  };
  const flushCode = () => {
    if (!inCode) return;
    html += `<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`;
    inCode = false;
    code = [];
  };

  for (const block of blocks) {
    if (block.startsWith('```')) {
      if (inCode) flushCode();
      else { flushList(); inCode = true; }
      continue;
    }
    if (inCode) { code.push(block); continue; }
    const lines = block.split('\n');
    if (lines.every(line => /^[-*•]\s+/.test(line))) {
      flushCode();
      list.push(...lines.map(line => line.replace(/^[-*•]\s+/, '')));
      continue;
    }
    flushList();
    flushCode();
    if (/^第[一二三四五六七八九十\d]+[章节部分]/.test(block) || /^\d+[.、]\s/.test(block)) {
      html += `<h2>${inlineMarkup(block)}</h2>`;
    } else if (/^[（(]?[一二三四五六七八九十\d]+[）)、.]/.test(block)) {
      html += `<h3>${inlineMarkup(block)}</h3>`;
    } else {
      html += `<p>${inlineMarkup(block).replace(/\n/g, '<br>')}</p>`;
    }
  }
  flushList();
  flushCode();
  return html;
}

if (!item) {
  root.innerHTML = '<div class="empty-state">文档不存在或链接已失效。</div>';
} else {
  root.innerHTML = `
    <header class="reader-header">
      <p class="eyebrow">${escapeHtml(item.project)} / ${escapeHtml(item.topic)}</p>
      <h1>${escapeHtml(item.title)}</h1>
      <p>${escapeHtml(item.excerpt || '')}</p>
      <div class="reader-meta">${(item.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
    </header>
    <div class="reading-layout">
      <aside class="reading-sidebar"><span>本文阅读</span><div class="reading-meter"><i></i></div><small id="reading-percent">0%</small></aside>
      <article class="reader-content">${renderDocument(item.content || '')}</article>
    </div>`;
  const meter = document.querySelector('.reading-meter i');
  const percent = document.querySelector('#reading-percent');
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 100;
    meter.style.width = `${value}%`;
    percent.textContent = `${value}%`;
  });
}
