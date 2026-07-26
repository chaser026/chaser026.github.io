const params = new URLSearchParams(location.search);
const documents = window.BLOG_DOCUMENTS || [];
const item = documents.find(doc => doc.id === params.get('id'));
const root = document.querySelector('#reader');

function escapeHtml(value = '') {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}

function inlineMarkup(text = '') {
  return escapeHtml(text)
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s，。、）\)]+)/g, (url) => `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`);
}

// Simple Prism-less syntax highlighter: colour keywords, strings, comments
function highlight(code, lang) {
  const escaped = escapeHtml(code);
  if (!lang || !['python', 'bash', 'json', 'shell', 'java', 'c++', 'yaml', 'sql'].includes(lang)) {
    return escaped;
  }
  // Apply in order to avoid overlaps
  return escaped
    .replace(/(#[^\n]*)/g, '<em class="hl-comment">$1</em>')
    .replace(/\b(def|class|return|import|from|if|else|elif|for|while|in|not|and|or|None|True|False|self|pass|raise|with|as|try|except|finally|lambda|yield|del|assert|break|continue|global|nonlocal|is|async|await|super|print)\b/g, '<strong class="hl-kw">$1</strong>')
    .replace(/((?:&quot;|&#039;)(?:(?!\1)[\s\S])*(?:\1))/g, '<em class="hl-str">$1</em>');
}

function renderBlock(b) {
  if (b.type === 'heading') {
    const level = Math.min(4, Math.max(2, b.level));
    return `<h${level}>${inlineMarkup(b.text)}</h${level}>`;
  }
  if (b.type === 'p') {
    return `<p>${inlineMarkup(b.text)}</p>`;
  }
  if (b.type === 'list') {
    return `<ul>${b.items.map(item => `<li>${inlineMarkup(item)}</li>`).join('')}</ul>`;
  }
  if (b.type === 'code') {
    const lang = b.lang || '';
    const label = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : '';
    return `<div class="code-card">${label}<pre><code>${highlight(b.text, lang)}</code></pre></div>`;
  }
  if (b.type === 'callout') {
    const childHtml = (b.children || []).map(renderBlock).join('');
    return `<div class="callout callout-blue"><span class="callout-title">${inlineMarkup(b.title)}</span><div class="callout-body">${childHtml}</div></div>`;
  }
  return '';
}

function buildToc(blocks = []) {
  const entries = blocks.filter(b => b.type === 'heading' && b.level <= 3);
  if (entries.length < 3) return '';
  let idx = 0;
  const links = entries.map(b => {
    const id = `h-${idx++}`;
    return `<a href="#${id}" class="toc-l${b.level}">${escapeHtml(b.text)}</a>`;
  }).join('');
  return `<nav class="reader-toc"><span>目录</span>${links}</nav>`;
}

if (!item) {
  root.innerHTML = '<div class="empty-state">文档不存在或链接已失效。</div>';
} else {
  const blocks = item.blocks || [];

  // Assign anchor ids to headings (level 2 and 3)
  let hIdx = 0;
  const bodyHtml = blocks.map(b => {
    const html = renderBlock(b);
    if (b.type === 'heading' && b.level <= 3) {
      return html.replace(/^<(h\d)/, `<$1 id="h-${hIdx++}"`);
    }
    return html;
  }).join('');

  root.innerHTML = `
    <header class="reader-header">
      <p class="eyebrow">${escapeHtml(item.course)} · ${escapeHtml(item.assignment)} / ${escapeHtml(item.module)}</p>
      <h1>${escapeHtml(item.title)}</h1>
      <p class="reader-sub">${escapeHtml(item.chapter && item.chapter !== '概述' ? item.chapter : item.module)}</p>
    </header>
    <div class="reading-progress"><i></i></div>
    <div class="reading-layout">
      <aside class="reading-aside">${buildToc(blocks)}</aside>
      <article class="reader-content">${bodyHtml}</article>
    </div>`;

  const bar = document.querySelector('.reading-progress i');
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? `${Math.min(100, (window.scrollY / max) * 100)}%` : '100%';
  });
}
