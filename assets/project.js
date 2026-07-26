const params = new URLSearchParams(location.search);
const course = params.get('id');
const documents = (window.BLOG_DOCUMENTS || []).filter(doc => doc.course === course);
const root = document.querySelector('#project');

const assignmentTitles = {
  A1: '架构实现与预训练实战',
  A5: '对齐与后训练',
};

function escapeHtml(value = '') {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function groupBy(list, key) {
  const map = new Map();
  for (const item of list) {
    const value = item[key];
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(item);
  }
  return map;
}

if (!documents.length) {
  root.innerHTML = '<div class="empty-state">项目不存在或暂无文档。</div>';
} else {
  const assignments = groupBy(documents, 'assignment');
  const header = `
    <header class="project-header">
      <p class="eyebrow">project / ${escapeHtml(course)}</p>
      <h1>${escapeHtml(course)}</h1>
      <p class="project-lede">从零构建语言模型的完整学习路径。共 ${documents.length} 篇文档，按作业与章节组织。</p>
    </header>`;

  const sections = [...assignments.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([assignment, docs]) => {
    const modules = groupBy(docs, 'module');
    const moduleBlocks = [...modules.entries()].map(([moduleName, moduleDocs]) => {
      const chapters = groupBy(moduleDocs, 'chapter');
      const chapterBlocks = [...chapters.entries()].map(([chapterName, chapterDocs]) => {
        const sortedDocs = chapterDocs.sort((a, b) => a.title.localeCompare(b.title, 'zh'));
        const docItems = sortedDocs.map(doc => `
          <a class="doc-row" href="reader.html?id=${encodeURIComponent(doc.id)}">
            <span class="doc-title">${escapeHtml(doc.title)}</span>
            <span class="doc-arrow">阅读 →</span>
          </a>`).join('');
        const showChapter = chapterName && chapterName !== '概述';
        return `<div class="chapter-block">${showChapter ? `<h4 class="chapter-title">${escapeHtml(chapterName)}</h4>` : ''}<div class="doc-list">${docItems}</div></div>`;
      }).join('');
      return `<div class="module-block"><h3 class="module-title">${escapeHtml(moduleName)}</h3>${chapterBlocks}</div>`;
    }).join('');

    return `
      <details class="assignment" open>
        <summary>
          <span class="assignment-badge">${escapeHtml(assignment)}</span>
          <span class="assignment-name">${escapeHtml(assignmentTitles[assignment] || assignment)}</span>
          <span class="assignment-count">${docs.length} 篇</span>
          <span class="assignment-toggle" aria-hidden="true">▾</span>
        </summary>
        <div class="assignment-body">${moduleBlocks}</div>
      </details>`;
  }).join('');

  root.innerHTML = header + `<div class="assignment-list">${sections}</div>`;
}
