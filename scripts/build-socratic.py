"""Собирает сократовские разборы деструктивных установок в dist/socratic.js.

Исходники: sources/socratic/u<номер>-v<вариант>.md — выгрузки разборов из библиотеки команды проекта
(Google Диск, папка разборов: v1 — «установка N», v2 — «подкаст (N)», v3 у установки 13 — «подкаст (13.1)»).
Разбор делится на семь шагов метода. Заголовки в исходниках различаются по номерам и формулировкам,
поэтому шаг определяется по ключевым словам заголовка:
  «Проясняем понятия» → 1, «Цепочка вопросов»/«Доказательная база» → 2, «Обнаружение противоречия» → 3,
  «Вывод» и «Важное различение» → 4 (различение идёт подзаголовком внутри шага), «Вопросы для закрепления»/
  «Завершающий синтез» → 5, «Практический критерий» → 6, «Итоговая … формула» → 7.
Если шага в разборе нет (в разборах 1–9 нет «Практического критерия»), он помечается missing.
Тексты переносятся дословно, снимается только разметка жирного шрифта и курсива.
"""
import glob, json, os, re
steps_names = ['Проясняем понятия', 'Цепочка вопросов', 'Обнаружение противоречия', 'Вывод',
               'Вопросы для закрепления', 'Практический критерий', 'Итоговая созидательная формула']
KEYS = [(1, r'Проясняем понятия'), (2, r'Цепочка вопросов|Доказательная база'), (3, r'Обнаружение противоречия'),
        (4, r'Важное различение'), (4, r'(Сократический )?[Вв]ывод$'), (5, r'Вопросы для закрепления|Завершающий синтез'),
        (6, r'Практический критерий'), (7, r'Итоговая')]
VARIANT_LABELS = {1: 'базовый', 2: 'с уровнями', 3: 'с уровнями · 13.1'}
clean = lambda s: re.sub(r'(?<!\w)_|_(?!\w)', '', re.sub(r'\*+', '', s)).strip()

def heading(raw):
    """Номер шага 1–7 и заголовок, если строка — заголовок шага (целиком жирная, короткая)."""
    s = raw.strip()
    if not (s.startswith('**') and s.endswith('**')) or len(s) > 140:
        return None
    t = re.sub(r'^\d+\.\s*', '', clean(s)).rstrip(':').strip()
    for n, k in KEYS:
        if re.match(k, t):
            return n, t
    return None

out = {}
files = sorted(glob.glob('sources/socratic/u*-v*.md'), key=lambda p: [int(x) for x in re.findall(r'\d+', os.path.basename(p))])
for path in files:
    uid, var = re.match(r'u(\d+)-v(\d+)', os.path.basename(path)).groups()
    intro, steps, cur = [], {}, None
    for raw in open(path, encoding='utf8').read().split('\n'):
        line = clean(raw)
        if not line:
            continue
        h = heading(raw)
        if h:
            n, title = h
            if n in steps and n == 4:          # «Важное различение» и «Вывод» — один шаг
                cur = steps[4]; cur['blocks'].append({'type': 'h', 'text': title}); continue
            assert n not in steps, (path, 'повтор шага', n, title)
            assert not steps or n > max(steps), (path, 'шаги не по порядку', n, title)
            cur = steps[n] = {'n': n, 'title': title, 'blocks': []}
            if n == 4 and title.startswith('Важное различение'):
                cur['title'] = steps_names[3]; cur['blocks'].append({'type': 'h', 'text': title})
            continue
        item = raw.lstrip().startswith('- ')
        block = {'type': 'li' if item else 'p', 'text': clean(raw.lstrip()[2:] if item else line)}
        (cur['blocks'] if cur else intro).append(block)
    for n in range(1, 8):
        if n not in steps:
            assert n == 6, (path, 'нет шага', n)
            steps[n] = {'n': n, 'title': steps_names[n - 1], 'blocks': [], 'missing': True}
        assert steps[n].get('missing') or steps[n]['blocks'], (path, 'пустой шаг', n)
    entry = out.setdefault(uid, {'id': 'u' + uid, 'number': int(uid), 'attitude': '', 'variants': []})
    if var == '1':
        entry['attitude'] = next(re.search(r'«[^»]+»', b['text']).group(0) for b in intro if '«' in b['text'])
    entry['variants'].append({'variant': int(var), 'label': VARIANT_LABELS.get(int(var), 'вариант ' + var),
                              'intro': [b['text'] for b in intro], 'steps': [steps[n] for n in range(1, 8)]})
for e in out.values():
    assert e['attitude'] and e['variants'][0]['variant'] == 1, e['id']
data = {'source': 'Библиотека сократовских разборов команды проекта «Киноуроки»', 'steps': steps_names,
        'items': sorted(out.values(), key=lambda x: x['number'])}
open('dist/socratic.js', 'w', encoding='utf8').write("'use strict';\n// Сгенерировано scripts/build-socratic.py. Не редактировать вручную.\nwindow.SOCRATIC = " + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')
for i in data['items']:
    print(i['id'], i['attitude'], [(v['variant'], ''.join('-' if s.get('missing') else str(len(s['blocks'])) + ' ' for s in v['steps'])) for v in i['variants']])
