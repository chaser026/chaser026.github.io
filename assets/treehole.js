/* 树洞页：萤火、视差、滚动渐显、Twikoo 挂载
 * IIFE 包裹：twikoo.min.js 组件会在顶层泄漏全局变量 var e/t，
 * 若本文件在顶层声明 const t 会触发 "Identifier 't' has already been declared"，导致整段脚本失效。 */
(function () {
const site = window.SITE || { site: {} };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// 1) 萤火
const field = document.querySelector('#fireflies');
if (field) {
  const count = matchMedia('(max-width: 800px)').matches ? 10 : 22;
  for (let i = 0; i < count; i++) {
    const f = document.createElement('i');
    f.className = 'firefly';
    const s = 2 + Math.random() * 3;
    f.style.cssText = `left:${Math.random() * 100}%;top:${15 + Math.random() * 70}%;width:${s}px;height:${s}px;animation-duration:${7 + Math.random() * 9}s,${2.6 + Math.random() * 3}s;animation-delay:${-Math.random() * 12}s,${Math.random() * 3}s;`;
    field.appendChild(f);
  }
}

// 2) 树的视差（滚动时远近景错动）
if (!reduceMotion) {
  const near = document.querySelector('.tree-near');
  const far = document.querySelector('.tree-far');
  const moon = document.querySelector('.moon');
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      if (near) near.style.transform = `translateY(${y * 0.10}px)`;
      if (far) far.style.transform = `translateY(${y * 0.05}px)`;
      if (moon) moon.style.transform = `translateY(${y * 0.16}px)`;
      ticking = false;
    });
  }, { passive: true });
}

// 3) 滚动渐显
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// 4) Twikoo 树洞
const mount = document.querySelector('#twikoo');
const t = (site.site && site.site.twikoo) || {};
if (mount) {
  if (!t.enabled || /填入|部署后/.test(t.envId || '')) {
    mount.innerHTML = `
      <div class="hole-hint">
        <h3>树洞还没凿开</h3>
        <p>只差几步：完成 Twikoo 后端部署后，</p>
        <p>把部署域名填进 <code>content/projects.json</code> 的 <code>site.twikoo.envId</code>，</p>
        <p>并将 <code>enabled</code> 改为 <code>true</code>，运行 <code>python3 build.py</code> 后推送即可。</p>
      </div>`;
  } else if (window.twikoo) {
    const opt = { envId: t.envId, el: '#twikoo', lang: t.lang || 'zh-CN', path: 'treehole' };
    if (t.region) opt.region = t.region;
    window.twikoo.init(opt);
  } else {
    mount.innerHTML = `
      <div class="hole-hint">
        <h3>回声暂时听不到</h3>
        <p>评论组件加载失败，多半是网络波动，刷新页面试试。</p>
      </div>`;
  }
}
})();
