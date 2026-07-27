const site = window.SITE || { site: {}, projects: [], documents: [] };
const meta = site.site || {};

// Site chrome
if (meta.title) document.querySelectorAll('[data-site-title]').forEach(el => el.textContent = meta.title);
if (meta.tagline) document.querySelectorAll('[data-site-tagline]').forEach(el => el.textContent = meta.tagline);
if (meta.github) document.querySelectorAll('[data-github]').forEach(el => el.href = meta.github);
if (meta.author) {
  const year = new Date().getFullYear();
  document.querySelectorAll('[data-copyright]').forEach(el => el.textContent = `© ${year} ${meta.author}`);
}

const documents = site.documents || [];
const projects = site.projects || [];

// Social links (个人主页链接)
const SOCIAL_LABELS = {
  github: 'GitHub',
  bilibili: '哔哩哔哩',
  xiaohongshu: '小红书',
  zhihu: '知乎',
  twitter: 'Twitter',
  x: 'X',
  juejin: '掘金',
  email: '邮箱',
};
const socialContainer = document.querySelector('#social-links');
if (socialContainer && meta.social) {
  const links = Object.entries(meta.social)
    .filter(([, url]) => url && !/你的|请填|xxx/i.test(url))
    .map(([key, url], i) => {
      const label = SOCIAL_LABELS[key] || key;
      const cls = i === 0 ? 'button button-primary' : 'button button-quiet';
      const href = key === 'email' ? `mailto:${url}` : url;
      return `<a class="${cls}" href="${href}" target="_blank" rel="noreferrer">${label} <span>↗</span></a>`;
    });
  socialContainer.innerHTML = links.join('');
}

// Stats
const docCount = document.querySelector('#doc-count');
const projectCount = document.querySelector('#project-count');
if (docCount) docCount.textContent = documents.length;
if (projectCount) projectCount.textContent = projects.length;

// Project cards
const grid = document.querySelector('#project-grid');
const emptyState = document.querySelector('#empty-state');
if (grid) {
  const cards = projects.map(project => {
    const docs = documents.filter(d => d.project === project.id);
    const assignments = new Set(docs.map(d => d.assignment));
    const modules = new Set(docs.map(d => d.module));
    const a = document.createElement('a');
    a.className = 'project-card project-card-link';
    a.href = `project.html?id=${encodeURIComponent(project.id)}`;
    a.innerHTML = `
      <div class="project-color"></div>
      <p class="card-kicker">${assignments.size} 个作业 · ${modules.size} 个模块</p>
      <h3>${project.name || project.id}</h3>
      <p class="card-sub">${project.subtitle || ''}</p>
      <p>${project.description || ''}</p>
      <div class="card-meta"><span>${docs.length} 篇文档</span><span class="open-link">进入项目 →</span></div>`;
    return a;
  });
  grid.replaceChildren(...cards);
  if (emptyState) emptyState.hidden = projects.length > 0;
}

// 树洞横栏 · 萤火
const bandField = document.querySelector('#hole-band-fireflies');
if (bandField) {
  const count = matchMedia('(max-width: 800px)').matches ? 6 : 14;
  for (let i = 0; i < count; i++) {
    const f = document.createElement('i');
    f.className = 'firefly';
    const s = 2 + Math.random() * 2.5;
    f.style.cssText = `left:${Math.random() * 100}%;top:${15 + Math.random() * 70}%;width:${s}px;height:${s}px;animation-duration:${7 + Math.random() * 8}s,${2.6 + Math.random() * 3}s;animation-delay:${-Math.random() * 10}s,${Math.random() * 3}s;`;
    bandField.appendChild(f);
  }
}
