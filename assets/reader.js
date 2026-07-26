const params = new URLSearchParams(location.search);
const documents = window.BLOG_DOCUMENTS || [];
const item = documents.find(doc => doc.id === params.get('id'));
const root = document.querySelector('#reader');

function escapeHtml(value = '') {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function inlineMarkup(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s，。）)]+)/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>');
}

function renderBlocks(blocks = []) {
  let html = '';
  let list = [];
  const flushList = () => {
    if (!list.length) return;
    html += `<ul>${list.map(text => `<li>${inlineMarkup(text)}</li>`).join('')}</ul>`;
    list = [];
  };
  for (const block of blocks) {
    if (block.type === 'li') { list.push(block.text); continue; }
    flushList();
    if (block.type === 'heading') {
      const level = Math.min(4, Math.max(2, block.level || 2));
      html += `<h${level}>${inlineMarkup(block.text)}</h${level}>`;
    } else if (block.type === 'code') {
      const label = block.lang ? `<span class="code-lang">${escapeHtml(block.lang)}</span>` : '';
      html += `<div class="code-card">${label}<pre><code>${escapeHtml(block.text)}</code></pre></div>`;
    } else {
      html += `<p>${inlineMarkup(block.text)}</p>`;
    }
  }
  flushList();
  return html;
}

function buildToc(blocks = []) {
  const entries = blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => block.type === 'heading' && block.level <= 3);
  if (entries.length < 3) return '';
  return `<nav class="reader-toc"><span>目录</span>${entries.map(({ block }, i) =>
    `<a href="#h-${i}" class="toc-l${block.level}">${escapeHtml(block.text)}</a>`).join('')}</nav>`;
}

if (!item) {
  root.innerHTML = '<div class="empty-state">文档不存在或链接已失效。</div>';
} else {
  let headingIndex = 0;
  const bodyHtml = renderBlocks(item.blocks || []).replace(/<h([234])>/g, (m, level) =>
    Number(level) <= 3 ? `<h${level} id="h-${headingIndex++}">` : m);

  root.innerHTML = `
    <header class="reader-header">
      <p class="eyebrow">${escapeHtml(item.course)} · ${escapeHtml(item.assignment)} / ${escapeHtml(item.module)}</p>
      <h1>${escapeHtml(item.title)}</h1>
      <p class="reader-sub">${escapeHtml(item.chapter && item.chapter !== '概述' ? item.chapter : item.module)}</p>
    </header>
    <div class="reading-progress"><i></i></div>
    <div class="reading-layout">
      <aside class="reading-aside">${buildToc(item.blocks || [])}</aside>
      <article class="reader-content">${bodyHtml}</article>
    </div>`;

  const bar = document.querySelector('.reading-progress i');
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? `${Math.min(100, (window.scrollY / max) * 100)}%` : '100%';
  });
}
