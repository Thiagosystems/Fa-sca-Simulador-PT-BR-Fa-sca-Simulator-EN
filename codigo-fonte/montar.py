"""Monta o index.html do Faísca: núcleo + módulos (em ordem numérica), num arquivo só.
Uso: python3 montar.py            -> grava ../index.html
     python3 montar.py saida.html -> grava em outro lugar"""
import os, sys, glob
aqui = os.path.dirname(os.path.abspath(__file__))
nucleo = open(os.path.join(aqui, 'nucleo.html'), encoding='utf-8').read()
mods = sorted(glob.glob(os.path.join(aqui, 'modulos', '*.js')))
i = nucleo.rfind('</script>')
js = '\n' + '\n'.join(open(m, encoding='utf-8').read() for m in mods) + '\n'
saida = sys.argv[1] if len(sys.argv) > 1 else os.path.join(aqui, '..', 'index.html')
open(saida, 'w', encoding='utf-8').write(nucleo[:i] + js + nucleo[i:])
print(f'ok: {len(mods)} módulos -> {os.path.abspath(saida)}')
# confere a sintaxe do JavaScript montado (se o Node.js estiver instalado)
import shutil, subprocess, tempfile
if shutil.which('node'):
    html = open(saida, encoding='utf-8').read()
    a = html.rfind('<script>'); b = html.rfind('</script>')
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t:
        t.write(html[a + 8:b]); nome = t.name
    r = subprocess.run(['node', '--check', nome], capture_output=True, text=True); os.remove(nome)
    if r.returncode:
        print('ERRO de sintaxe no JavaScript:\n' + r.stderr.strip()[:800]); sys.exit(1)
    print('sintaxe do JavaScript: ok')
