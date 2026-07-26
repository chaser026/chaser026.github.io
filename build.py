#!/usr/bin/env python3
"""静态博客构建脚本。

扫描 content/ 目录，生成前端使用的 data/site.js。

用法：
    python3 build.py

内容组织约定（详见 GUIDE.md）：
    content/projects.json                     站点与项目元信息
    content/thoughts.json                     今日思考条目
    content/projects/<项目id>/<...>/<文档>.md  项目文档，目录层级自动成为导航层级
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / 'content'
OUTPUT = ROOT / 'data' / 'site.js'


def read_json(path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding='utf-8'))


def first_heading(md, fallback):
    for line in md.splitlines():
        m = re.match(r'^#{1,3}\s+(.*)', line.strip())
        if m:
            return m.group(1).strip()
    return fallback


def make_excerpt(md, limit=140):
    text = md
    text = re.sub(r'```.*?```', '', text, flags=re.S)      # remove code blocks
    text = re.sub(r'>\s*\[![A-Z]+\][^\n]*', '', text)        # remove callout markers
    text = re.sub(r'[#>*`\-\|]', '', text)                    # strip md symbols
    text = re.sub(r'\$\$?[^$]*\$\$?', '', text)               # strip latex
    text = re.sub(r'\s+', ' ', text).strip()
    return (text[:limit] + '…') if len(text) > limit else text


def slugify(rel_path):
    return rel_path.replace('/', '__').replace(' ', '_').replace('.md', '')


def build():
    meta = read_json(CONTENT / 'projects.json', {'site': {}, 'projects': []})
    thoughts = read_json(CONTENT / 'thoughts.json', [])

    documents = []
    projects_out = []

    for project in meta.get('projects', []):
        pid = project['id']
        base = CONTENT / 'projects' / pid
        assignments = project.get('assignments', {})
        doc_count = 0
        if base.exists():
            for md_path in sorted(base.rglob('*.md')):
                rel = md_path.relative_to(base)
                parts = list(rel.parts)
                top = parts[0] if len(parts) > 1 else pid
                assignment = assignments.get(top, top)
                module = parts[1] if len(parts) > 2 else (parts[0] if len(parts) > 1 else '综合')
                chapter = parts[2] if len(parts) > 3 else '概述'
                md = md_path.read_text(encoding='utf-8')
                title = first_heading(md, md_path.stem)
                documents.append({
                    'id': f'{pid}::' + slugify(str(rel)),
                    'project': pid,
                    'assignment': assignment,
                    'module': module,
                    'chapter': chapter,
                    'title': title,
                    'excerpt': make_excerpt(md),
                    'markdown': md,
                })
                doc_count += 1
        p = dict(project)
        p['docCount'] = doc_count
        projects_out.append(p)

    site = {
        'site': meta.get('site', {}),
        'projects': projects_out,
        'documents': documents,
        'thoughts': thoughts,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        'window.SITE = ' + json.dumps(site, ensure_ascii=False) + ';\n',
        encoding='utf-8',
    )
    print(f'built {len(documents)} documents across {len(projects_out)} projects, {len(thoughts)} thoughts')
    print(f'output -> {OUTPUT.relative_to(ROOT)}')


if __name__ == '__main__':
    build()
