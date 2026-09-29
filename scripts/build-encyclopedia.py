"""Выбирает статьи из «Энциклопедии прикладной этики (качеств)» для курсов.

Запуск: python3 scripts/build-encyclopedia.py <путь к выгрузке .docx.txt>
Результат: dist/encyclopedia.js (window.ENCYCLOPEDIA) — только нужные курсам статьи, дословно.
Полный текст энциклопедии в репозиторий не кладётся: это рабочая редакция команды.
Раздел 1.2 (карточки источников) не переносится — он длинный и не нужен педагогу на экране.
"""
import json, re, sys
ARTICLES = {'spravedlivost': 'Справедливость', 'schastye': 'Счастье', 'soradovanie': 'Сорадование'}
EDITION = '09.09.2026'
src = open(sys.argv[1], encoding='utf8').read().split('\n')
starts = {l[2:].strip(): i for i, l in enumerate(src) if l.startswith('# ')}
order = sorted(starts.values())
out = {'title': 'Энциклопедия прикладной этики (Энциклопедия качеств)', 'edition': EDITION,
       'status': 'Рабочая редакция, дорабатывается', 'articles': {}}
clean = lambda s: re.sub(r'\*\*|\*', '', s).strip()
for key, name in ARTICLES.items():
    a = starts[name]; b = next(i for i in order if i > a)
    sections, cur, skip = [], None, False
    for line in src[a + 1:b]:
        if re.match(r'^\*\*КАЧЕСТВО \d+', line.strip()):
            break
        m = re.match(r'^(#{2,3}) (.+)$', line)
        if m:
            skip = m.group(2).startswith('1.2.')
            if skip:
                continue
            cur = {'level': len(m.group(1)), 'title': clean(m.group(2)), 'text': []}
            sections.append(cur)
            continue
        if skip or cur is None or not line.strip():
            continue
        cur['text'].append(clean(line))
    out['articles'][key] = {'name': name, 'sections': [s for s in sections if s['text'] or s['level'] == 2]}
open('dist/encyclopedia.js', 'w', encoding='utf8').write("'use strict';\n// Сгенерировано scripts/build-encyclopedia.py. Не редактировать вручную.\nwindow.ENCYCLOPEDIA = " + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
print({k: sum(len(s['text']) for s in v['sections']) for k, v in out['articles'].items()})
