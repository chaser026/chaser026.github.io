const site = window.SITE || { site: {}, projects: [], documents: [], thoughts: [] };
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
const thoughts = site.thoughts || [];

// Stats
const docCount = document.querySelector('#doc-count');
const projectCount = document.querySelector('#project-count');
const thoughtCount = document.querySelector('#thought-count');
if (docCount) docCount.textContent = documents.length;
if (projectCount) projectCount.textContent = projects.length;
if (thoughtCount) thoughtCount.textContent = thoughts.length;

// Hero thought
if (thoughts.length && document.querySelector('[data-hero-thought]')) {
  document.querySelector('[data-hero-thought]').textContent = thoughts[0].title;
}

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

// Thoughts preview (只展示最近 3 条，完整列表在 thoughts.html)
const thoughtsPreview = document.querySelector('#thoughts-preview');
function escapeHtml(v = '') {
  return v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}
if (thoughtsPreview && thoughts.length) {
  const recent = thoughts.slice(0, 3);
  thoughtsPreview.innerHTML = recent.map((t, i) => `
    <a class="thought-preview-card" href="thoughts.html#t-${i}">
      <span class="thought-preview-date">${escapeHtml(t.date || '')}</span>
      <span class="thought-preview-topic">${escapeHtml(t.topic || '')}</span>
      <h3>${escapeHtml(t.title || '')}</h3>
    </a>`).join('');
}
