# Faísca — código-fonte

O site publicado é um arquivo só (`../index.html`). Ele é **montado** a partir destas partes:

| Arquivo | O que tem |
|---|---|
| `nucleo.html` | Interface, desenho, simulação (análise nodal, passo de tempo, transistores, indutor, amp. op.), diagnóstico, CLP/ladder/GRAFCET, pneumática, PDF, projetos e arquivos `.fais` |
| `modulos/01-numeracao-contatos.js` | Numeração editável dos contatos (53-54, 61-62…) |
| `modulos/02-simbolos-cadesimu-estrela-triangulo.js` | Símbolos no estilo CADe_SIMU, motor com PE, modelo estrela-triângulo 24 Vcc |
| `modulos/03-redimensionar.js` | Alças para diminuir/aumentar a seleção e "Caber na folha" |
| `modulos/04-fios-curvas-invisiveis.js` | Curvas de fio invisíveis, junção automática, cancelar fio |
| `modulos/05-clp-analogico-ladder.js` | E/S analógicas, CTD/CTUD, comparadores, IN_RANGE, MOVE |
| `modulos/06-circuitos-integrados.js` | CIs DIP (74HC, CD4000, NE555, 595…), display, reguladores, sensores, modelos com CIs |
| `modulos/07-portas-logicas-nome-arrastavel.js` | Portas lógicas (símbolo simples, 2 a 8 entradas) e nome arrastável |
| `modulos/08-simulacao-fina-indutor-ampop.js` | Indutor, corrente de partida dos motores, amplificadores operacionais |
| `modulos/09-grade-rotulo-png-blocos.js` | Terminais na grade, rótulo de rede, exportar PNG, Meus blocos |
| `modulos/10-clp-st-varias-cpus.js` | Programa em texto estruturado (ST) e várias CPUs com prefixo |
| `modulos/11-duvidas.js` | Aba Dúvidas (ajuda pesquisável) |
| `modulos/12-componentes-tinkercad.js` | Componentes do Tinkercad (sensores, telas, NeoPixel, servo, instrumentos, micro:bit…) |
| `modulos/12a-placas.js` | Placas Arduino Nano, Mega 2560, ESP32 e Raspberry Pi Pico (simulação) |
| `modulos/13b-micropython.js` | Intérprete de MicroPython (lexer, parser e execução passo a passo) com os módulos machine, time, network, neopixel, ssd1306 etc. |
| `modulos/13-arduino-cpp.js` | Programa C++ do Arduino (interpretador, bibliotecas, monitor serial) |
| `modulos/14-protoboard.js` | Modo Protoboard: vista física sincronizada com o esquema |
| `modulos/15-placas-protoboard-galeria.js` | Desenho das placas novas na protoboard e galeria de projetos com Arduino |
| `modulos/17-datasheets.js` | Valores de datasheet dos componentes (LED por cor, resistor, potenciômetro, diodo, LDR, MOSFET, reguladores, relés) |
| `modulos/16-modulos-osc-defeitos.js` | OLED, módulo relé, L298N, motor de passo, encoder KY-040, bibliotecas WiFi/SSD1306/Stepper, Serial Plotter, trigger e pontas do osciloscópio, defeitos visíveis na protoboard |

Os módulos entram em ordem numérica, depois do núcleo. Cada um acrescenta ou ajusta funções do núcleo.

## Montar

```
python3 montar.py          # grava ../index.html
```

## Testar (precisa de Python + Playwright com Chromium)

```
python3 testes/funcoes.py      # resultados esperados: lógica, 555, amp. op., indutor, ST, fios, arquivos…
python3 testes/auditoria.py    # todos os modelos nos dois idiomas, paleta inteira, menus, 600 ações aleatórias, celular
```

Os dois saem com código 1 se algo falhar. Rode depois de qualquer mudança.

Depois de publicar uma versão nova, aumente `VERSAO` em `../sw.js` para os aplicativos instalados se atualizarem.
