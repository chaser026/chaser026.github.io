const documents = window.BLOG_DOCUMENTS || [];
const projects = [...new Set(documents.map(item => item.project))];
const topics = [...new Set(documents.map(item => item.topic))];
let activeProject = '全部';

const searchInput = document.querySelector('#search');
const filters = document.querySelector('#filters');
const grid = document.querySelector('#project-grid');
const emptyState = document.querySelector('#empty-state');

document.querySelector('#doc-count').textContent = documents.length;
document.querySelector('#project-count').textContent = projects.length;
document.querySelector('#topic-count').textContent = topics.length;

function makeFilter(name) {
  const button = document.createElement('button');
  button.className = `filter${name === activeProject ? ' active' : ''}`;
  button.type = 'button';
  button.textContent = name;
  button.addEventListener('click', () => {
    activeProject = name;
    renderFilters();
    renderDocuments();
  });
  return button;
}

function renderFilters() {
  filters.replaceChildren(...['全部', ...projects].map(makeFilter));
}

function matches(item, query) {
  const inProject = activeProject === '全部' || item.project === activeProject;
  const haystack = `${item.title} ${item.project} ${item.topic} ${(item.tags || []).join(' ')} ${item.excerpt || ''}`.toLowerCase();
  return inProject && haystack.includes(query.toLowerCase());
}

function card(item) {
  const article = document.createElement('article');
  article.className = 'project-card';
  article.innerHTML = `
    <div class="project-color"></div>
    <h3>${item.title}</h3>
    <p>${item.excerpt || `${item.topic}项目文档，包含原始讲义与正文预览。`}</p>
    <div class="card-meta">
      <div><div class="tags">${(item.tags || []).slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}</div><span>${item.project} · ${item.topic}</span></div>
      <a class="open-link" href="reader.html?id=${encodeURIComponent(item.id)}">阅读 →</a>
    </div>`;
  return article;
}

function renderDocuments() {
  const query = searchInput.value.trim();
  const visible = documents.filter(item => matches(item, query));
  grid.replaceChildren(...visible.map(card));
  emptyState.hidden = visible.length > 0;
}

searchInput.addEventListener('input', renderDocuments);
renderFilters();
renderDocuments();
