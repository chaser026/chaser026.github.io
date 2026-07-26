const params = new URLSearchParams(location.search);
const item = (window.BLOG_DOCUMENTS || []).find(doc => doc.id === params.get('id'));
const root = document.querySelector('#reader');
function escapeHtml(value=''){return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function markdown(value=''){
  let html=escapeHtml(value);
  html=html.replace(/^### (.*)$/gm,'<h3>$1</h3>').replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/^# (.*)$/gm,'<h2>$1</h2>');
  html=html.replace(/^```[a-zA-Z]*\n([\s\S]*?)```$/gm,'<pre>$1</pre>');
  html=html.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  html=html.replace(/^[-*] (.*)$/gm,'<li>$1</li>');
  html=html.replace(/(<li>.*<\/li>\n?)+/g,m=>`<ul>${m}</ul>`);
  html=html.split(/\n{2,}/).map(block=>/^<(h2|h3|pre|ul)/.test(block)?block:`<p>${block.replace(/\n/g,'<br>')}</p>`).join('');
  return html;
}
if(!item){root.innerHTML='<div class="empty-state">文档不存在或链接已失效。</div>';}
else{root.innerHTML=`<header class="reader-header"><p class="eyebrow">${escapeHtml(item.project)} / ${escapeHtml(item.topic)}</p><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.excerpt||'')}</p><div class="reader-meta">${(item.tags||[]).map(tag=>`<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div><a class="download-link" href="${encodeURI(item.file)}" download>下载原始文档 ↗</a></header><article class="reader-content">${markdown(item.content||'')}</article>`;}
