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

// ── 公式保护 ─────────────────────────────────────────────────────────────
// marked 先于 KaTeX 解析整篇文档：行内解析会把公式里的 `_`/`*` 当成
// 强调语法（拆散公式），还会吃掉 `\_` 这类反斜杠转义。被拆散/改写的公式
// auto-render 无法识别，页面上就会露出原始 LaTeX 文本。
// 解决办法：交给 marked 之前先把代码块之外的公式段（$$...$$、$...$、
// \[...\]、\(...\)）抽出换成占位符，marked 输出后再把原文（做 HTML 转义）
// 还原回去，交由 auto-render 正常渲染。

// 与 KaTeX auto-render 的 findEndOfMath 相同：从 startIndex 起寻找右定界符，
// 期间跟踪 {} 层级并跳过反斜杠转义。
function findEndOfMath(delimiter, text, startIndex) {
  let index = startIndex;
  let braceLevel = 0;
  const delimLength = delimiter.length;
  while (index < text.length) {
    const character = text[index];
    if (braceLevel <= 0 && text.slice(index, index + delimLength) === delimiter) {
      return index;
    } else if (character === '\\') {
      index++;
    } else if (character === '{') {
      braceLevel++;
    } else if (character === '}') {
      braceLevel--;
    }
    index++;
  }
  return -1;
}

function protectMath(md) {
  const segments = [];
  const placeholder = i => '\uE000' + i + '\uE001';
  const stash = s => { segments.push(s); return placeholder(segments.length - 1); };
  // $$ 必须排在 $ 之前，避免 $ 先抢走 $$ 的前一半
  const DELIMS = [
    { left: '$$', right: '$$' },
    { left: '\\[', right: '\\]' },
    { left: '\\(', right: '\\)' },
    { left: '$', right: '$' },
  ];

  const lines = md.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 围栏代码块整体跳过（marked 本就按字面处理其内容）
    const fenceOpen = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (fenceOpen) {
      const marker = fenceOpen[1];
      out.push(line);
      i++;
      while (i < lines.length) {
        out.push(lines[i]);
        const t = lines[i].trim();
        const isClose = t.length >= marker.length && [...t].every(c => c === marker[0]);
        i++;
        if (isClose) break;
      }
      continue;
    }

    // 按行内代码 span 切开，代码部分原样保留（auto-render 也跳过 <code>）
    const parts = line.split(/(``[^`]*``|`[^`\n]*`)/);

    let opened = null;   // 跨行公式的开头信息
    for (let pi = 0; pi < parts.length && !opened; pi++) {
      if (pi % 2 === 1) continue;
      let frag = parts[pi];
      let guard = 0;
      while (frag && guard++ < 500 && !opened) {
        // 找最靠左的左定界符（与 auto-render 的行为一致）
        let best = null;
        for (const d of DELIMS) {
          const pos = frag.indexOf(d.left);
          if (pos !== -1 && (!best || pos < best.pos)) best = { left: d.left, right: d.right, pos };
        }
        if (!best) break;
        const end = findEndOfMath(best.right, frag, best.pos + best.left.length);
        if (end !== -1) {
          const segEnd = end + best.right.length;
          frag = frag.slice(0, best.pos) + stash(frag.slice(best.pos, segEnd)) + frag.slice(segEnd);
          continue;
        }
        // 本行找不到匹配的右定界符
        if (best.left === '$') break;          // 落单的 $：不处理，保持现状
        // $$ / \\[ / \\( 允许跨行：记录开口，把后续内容收进公式段
        opened = { right: best.right, slot: segments.length };
        segments.push(null);
        opened.first = frag.slice(best.pos);                 // 左定界符到本片段末尾
        opened.tail = parts.slice(pi + 1).join('');          // 本行其余部分也属于公式
        frag = frag.slice(0, best.pos) + placeholder(opened.slot);
      }
      parts[pi] = frag;
    }

    if (opened) {
      const buf = [opened.first + opened.tail];
      i++;
      let closed = false;
      while (i < lines.length) {
        // 续行若在引用块内（> $$ ...），剥掉引用前缀，避免 "> " 混入公式内容
        const qm = /^\s{0,3}>\s?/.exec(lines[i]);
        const content = qm ? lines[i].slice(qm[0].length) : lines[i];
        const idx = content.indexOf(opened.right);
        if (idx === -1) { buf.push(content); i++; continue; }
        buf.push(content.slice(0, idx + opened.right.length));
        segments[opened.slot] = buf.join('\n');
        const rest = content.slice(idx + opened.right.length);
        // 闭合行的剩余部分仍属于引用块：保留引用前缀，避免把块截断
        lines[i] = rest.trim() ? (qm ? qm[0] + rest : rest) : (qm ? '>' : '');
        closed = true;
        break;
      }
      if (!closed) segments[opened.slot] = buf.join('\n');   // 未闭合兜底
      out.push(parts.join(''));
      if (closed) continue;   // 回到循环顶部处理被截断的 lines[i]
      i++;
      continue;
    }

    out.push(parts.join(''));
    i++;
  }
  return { text: out.join('\n'), segments };
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
  // 先抽出公式段再交给 marked，解析完成后还原（转义防止被当成 HTML 标签），
  // 最后由下方的 KaTeX auto-render 统一渲染
  const protectedMd = protectMath(item.markdown || '');
  article.innerHTML = marked.parse(protectedMd.text)
    .replace(/\uE000(\d+)\uE001/g, (m, n) => escapeHtml(protectedMd.segments[Number(n)] || ''));

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
