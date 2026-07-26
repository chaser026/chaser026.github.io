const site = window.SITE || { site: {}, thoughts: [] };
const meta = site.site || {};
const thoughts = site.thoughts || [];

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

// Group thoughts by date (already in reverse-chronological order in JSON)
function groupByDate(list) {
  const map = new Map();
  list.forEach((t, i) => {
    const date = t.date || '未标注日期';
    if (!map.has(date)) map.set(date, []);
    map.get(date).push({ ...t, index: i });
  });
  return map;
}

const timeline = document.querySelector('#thoughts-timeline');
if (timeline) {
  if (!thoughts.length) {
    timeline.innerHTML = '<div class="empty-state">还没有记录。在 content/thoughts.json 添加一条即可。</div>';
  } else {
    const groups = groupByDate(thoughts);
    timeline.innerHTML = [...groups.entries()].map(([date, items]) => `
      <section class="timeline-day">
        <div class="timeline-date"><span class="timeline-dot"></span>${escapeHtml(date)}</div>
        <div class="timeline-cards">
          ${items.map(t => `
            <article class="timeline-card" id="t-${t.index}">
              ${t.topic ? `<span class="timeline-topic">${escapeHtml(t.topic)}</span>` : ''}
              <h3>${escapeHtml(t.title || '')}</h3>
              ${t.body ? `<p>${escapeHtml(t.body)}</p>` : ''}
            </article>`).join('')}
        </div>
      </section>`).join('');
  }
}
