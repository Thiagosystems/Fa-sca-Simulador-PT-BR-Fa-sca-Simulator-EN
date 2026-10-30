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
