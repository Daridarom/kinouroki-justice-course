"""Собирает сократовские разборы деструктивных установок в dist/socratic.js.

Исходники: sources/socratic/u<номер>-v<вариант>.md — выгрузки разборов из библиотеки команды проекта.
Разбор делится на семь шагов метода по заголовкам «1. Проясняем понятия» … «7. Итоговая созидательная формула».
Тексты переносятся дословно, снимается только разметка жирного шрифта.
"""
import glob, json, os, re
steps_names = ['Проясняем понятия', 'Цепочка вопросов', 'Обнаружение противоречия', 'Вывод',
               'Вопросы для закрепления', 'Практический критерий', 'Итоговая созидательная формула']
clean = lambda s: re.sub(r'\*+', '', s).strip()
out = {}
for path in sorted(glob.glob('sources/socratic/u*-v*.md')):
    uid, var = re.match(r'u(\d+)-v(\d+)', os.path.basename(path)).groups()
    lines = open(path, encoding='utf8').read().split('\n')
    intro, steps, cur = [], [], None
    for raw in lines:
        line = clean(raw)
        if not line:
            continue
        m = re.match(r'^(\d)\.\s+(.+)$', line)
        if m and 1 <= int(m.group(1)) <= 7 and len(line) < 120 and not raw.lstrip().startswith('-'):
            cur = {'n': int(m.group(1)), 'title': m.group(2), 'blocks': []}
            steps.append(cur); continue
        item = raw.lstrip().startswith('- ')
        block = {'type': 'li' if item else 'p', 'text': clean(raw.lstrip()[2:] if item else line)}
        (cur['blocks'] if cur else intro).append(block)
    attitude = next((re.search(r'«[^»]+»', b['text']).group(0) for b in intro if '«' in b['text']), '')
    assert len(steps) == 7, (path, [s['title'] for s in steps])
    entry = out.setdefault(uid, {'id': 'u' + uid, 'number': int(uid), 'attitude': attitude, 'variants': []})
    entry['variants'].append({'variant': int(var), 'intro': [b['text'] for b in intro], 'steps': steps})
data = {'source': 'Библиотека сократовских разборов команды проекта «Киноуроки»', 'steps': steps_names,
        'items': sorted(out.values(), key=lambda x: x['number'])}
open('dist/socratic.js', 'w', encoding='utf8').write("'use strict';\n// Сгенерировано scripts/build-socratic.py. Не редактировать вручную.\nwindow.SOCRATIC = " + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')
print([(i['id'], i['attitude'], [len(v['steps']) for v in i['variants']]) for i in data['items']])
