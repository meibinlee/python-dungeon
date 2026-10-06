"""Teacher-facing answer checks. Receives current questions as JSON from check-game.cjs."""
import contextlib
import io
import json
import keyword
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


for question in questions:
    correct = question['choices'][question['answer']]
    if question['id'] == 's1-q1':
        valid = [name for name in question['choices'] if name.isidentifier() and not keyword.iskeyword(name)]
        assert valid == [correct], (question['id'], valid, correct)
    elif question['id'] == 's2-q3':
        # The wording requires BOTH conditions: verify all truth-table combinations,
        # rather than checking only one example whose output could be ambiguous.
        valid = []
        for choice in question['choices']:
            satisfies = True
            for keys in (-1, 0, 1):
                for energy in (-1, 0, 1):
                    code = question['code'].replace('keys = 1', f'keys = {keys}').replace('energy = 0', f'energy = {energy}').replace('___', choice)
                    satisfies &= output(code) == str(keys > 0 and energy > 0)
            if satisfies:
                valid.append(choice)
        assert valid == [correct], (question['id'], valid, correct)
    else:
        actual = output(question['code'])
        assert actual == correct, (question['id'], actual, correct)
    print(f"PASS Python answer {question['id']}: {correct!r}")

assert output('score = 3\nscore = score + 2\nprint(score)') == '5'
print('PASS reported score example: actual output is 5')


def normalized(code):
    """Detect repeats even when variables and numeric literals are changed.

    Preserve string contents and operators: '# checkpoint' and an actual comment,
    and equality versus threshold comparisons, are different lesson tasks.
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
        elif item.type == tokenize.INDENT:
            value = '<indent>'
        elif item.type == tokenize.NEWLINE:
            value = '<newline>'
        parts.append((item.type, value))
    return tuple(parts)


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
