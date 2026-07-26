const documents = window.BLOG_DOCUMENTS || [];

const projectMeta = {
  CS336: {
    name: 'CS336',
    subtitle: 'Language Modeling from Scratch',
    description: '从零实现大语言模型：Tokenizer、Transformer 架构、训练、推理，到指令微调与强化学习对齐。',
    accent: 'green',
  },
};

const grid = document.querySelector('#project-grid');
const emptyState = document.querySelector('#empty-state');

const courses = [...new Set(documents.map(doc => doc.course))];

document.querySelector('#doc-count').textContent = documents.length;
document.querySelector('#project-count').textContent = courses.length;
document.querySelector('#topic-count').textContent = new Set(documents.map(doc => `${doc.course}/${doc.module}`)).size;

function projectCard(course) {
  const docs = documents.filter(doc => doc.course === course);
  const assignments = [...new Set(docs.map(doc => doc.assignment))];
  const modules = [...new Set(docs.map(doc => doc.module))];
  const meta = projectMeta[course] || { name: course, subtitle: '', description: '项目文档集合。' };
  const article = document.createElement('a');
  article.className = 'project-card project-card-link';
  article.href = `project.html?id=${encodeURIComponent(course)}`;
  article.innerHTML = `
    <div class="project-color"></div>
    <p class="card-kicker">${assignments.length} 个作业 · ${modules.length} 个模块</p>
    <h3>${meta.name}</h3>
    <p class="card-sub">${meta.subtitle || ''}</p>
    <p>${meta.description}</p>
    <div class="card-meta">
      <span>${docs.length} 篇文档</span>
      <span class="open-link">进入项目 →</span>
    </div>`;
  return article;
}

grid.replaceChildren(...courses.map(projectCard));
emptyState.hidden = courses.length > 0;
