"""Teacher-facing answer checks. Receives current questions as JSON from check-game.cjs."""
import contextlib
import ast
import io
import json
import keyword
import re
import sys
import token
import tokenize

data = json.load(sys.stdin)
questions = data['questions']


def output(code, answer_input='4'):
    buffer = io.StringIO()
    # These are the reviewed local lesson snippets, never code supplied through gameplay.
    with contextlib.redirect_stdout(buffer):
        exec(code, {'input': lambda prompt='': answer_input})
    return buffer.getvalue().rstrip('\n')


def check_answer(question):
    """Run the snippet in real Python and confirm the marked choice is the only right one."""
    correct = question['choices'][question['answer']]
    assert len({choice.strip() for choice in question['choices']}) == 4, (question['id'], 'choices must be distinct', question['choices'])
    if question['id'] == 's1-q1':
        valid = [name for name in question['choices'] if name.isidentifier() and not keyword.iskeyword(name)]
        assert valid == [correct], (question['id'], valid, correct)
    elif question['id'] == 's2-q3':
        # The wording requires BOTH (and) or EITHER (or): verify all truth-table combinations,
        # rather than checking only one example whose output could be ambiguous.
        logic = question.get('logic', 'and')
        assignments = re.findall(r'^(\w+) = -?\d+$', question['code'], re.M)
        assert len(assignments) == 2, (question['id'], question['code'])
        a, b = assignments
        valid = []
        for choice in question['choices']:
            satisfies = True
            for x in (-1, 0, 1, 2):
                for y in (-1, 0, 1, 2):
                    code = re.sub(rf'^{a} = -?\d+$', f'{a} = {x}', question['code'], flags=re.M)
                    code = re.sub(rf'^{b} = -?\d+$', f'{b} = {y}', code, flags=re.M).replace('___', choice)
                    expected = (x > 0 and y > 0) if logic == 'and' else (x > 0 or y > 0)
                    try:
                        satisfies &= output(code) == str(expected)
                    except Exception:
                        satisfies = False
            if satisfies:
                valid.append(choice)
        assert valid == [correct], (question['id'], logic, valid, correct)
    else:
        actual = output(question['code'], question.get('input', '4'))
        expected = '' if correct == '아무것도 출력되지 않는다' else correct
        # Other choices must not also match the real output.
        assert sum(('' if c == '아무것도 출력되지 않는다' else c) == actual for c in question['choices']) == 1, (question['id'], question['choices'], actual)
        assert actual == expected, (question['id'], question['code'], actual, correct)
    return correct


for question in questions:
    correct = check_answer(question)
    print(f"PASS Python answer {question['id']}: {correct!r}")

variants = data.get('variants', [])
for variant in variants:
    check_answer(variant)
if variants:
    print(f'PASS Python answers for {len(variants)} randomly generated variants (all {len({v["id"] for v in variants})} question patterns)')

assert output('score = 3\nscore = score + 2\nprint(score)') == '5'
print('PASS reported score example: actual output is 5')


def normalized(code):
    """Detect repeats even when variables and numeric literals are changed.

    Normalize ordinary string values as well, so swapping names/messages does not
    disguise an old example. A literal '#' inside quotes is a separate lesson task.
    """
    if not code:
        return None
    names = {}
    parts = []
    for item in tokenize.generate_tokens(io.StringIO(code).readline):
        if item.type in (tokenize.COMMENT, tokenize.NL, tokenize.ENCODING, tokenize.ENDMARKER):
            continue
        value = item.string
        if item.type == token.NAME and not keyword.iskeyword(value) and value not in ('print', 'input', 'int', 'range'):
            value = names.setdefault(value, f'var{len(names)}')
        elif item.type == token.NUMBER:
            value = '<number>'
        elif item.type == token.STRING:
            try:
                literal = ast.literal_eval(value)
                value = '<hash-string>' if isinstance(literal, str) and '#' in literal else '<string>'
            except (SyntaxError, ValueError):
                value = '<string>'
        elif item.type == tokenize.INDENT:
            value = '<indent>'
        elif item.type == tokenize.NEWLINE:
            value = '<newline>'
        parts.append((item.type, value))
    return tuple(parts)


for index, question in enumerate(questions):
    for other in questions[index + 1:]:
        assert question['question'].strip().casefold() != other['question'].strip().casefold(), (question['id'], other['id'], 'duplicate in dungeon')
        if question['code'] and other['code']:
            assert normalized(question['code']) != normalized(other['code']), (question['id'], other['id'], 'duplicate dungeon code template')
print('PASS no duplicate question wording or code templates within dungeon')

sibling = data.get('sibling', [])
if sibling:
    for question in questions:
        for other in sibling:
            assert question['question'].strip() != other['question'].strip(), (question['id'], other['id'], 'same wording')
            if question['code'] and other['code']:
                assert normalized(question['code']) != normalized(other['code']), (question['id'], other['id'], 'same code template')
    print(f'PASS overlap review: {len(questions)} current / {len(sibling)} sibling questions; no identical wording or normalized code template')
else:
    print('SKIP sibling comparison: python-mini-game is not present next to this checkout')
