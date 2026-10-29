# Faísca — simulador de comandos elétricos

Feito por **Thiagosystems**. Simulador de comandos elétricos, eletrônica, CLP e pneumática que roda no navegador, calcula tensões e correntes reais e funciona como aplicativo instalável (também sem internet).

[English version](README.md)

## Como usar

- **Abrir:** abra o `index.html` no navegador, ou publique a pasta num site com https (GitHub Pages, Netlify, Vercel) para poder instalar como aplicativo.
- **Instalar:** no Chrome ou Edge, use o ícone de instalar na barra de endereço ou **Arquivo → Instalar aplicativo**. No Android, menu **⋮ → Instalar aplicativo**; no iPhone, **Compartilhar → Adicionar à Tela de Início**.
- **Exemplo pronto:** `Estrela-triangulo-24Vcc.fais` abre em **Arquivo → Abrir arquivo .fais**. O mesmo circuito está em **Modelos prontos → Estrela-triângulo com comando 24 Vcc**.

## Recursos

**Desenho**
- Mais de 230 itens em 19 bibliotecas: alimentação, fusíveis e seccionadores, DR e disjuntores (símbolo simplificado ou detalhado), contatores, motores, partida e velocidade, contatos e temporizadores, botoeiras (impulso, retenção, dupla NA+NF, comutadora, luminosa, de puxar, pedal, emergência), detectores, sinalização, relés eletrônicos, lógica, CLP, Ladder, GRAFCET, pneumática, cabos, eletrônica e circuitos integrados.
- **Numeração editável dos contatos** (ex.: 53-54, 61-62, 83-84), como no CADe_SIMU.
- Símbolos no estilo do CADe_SIMU: transformador com núcleo (1-2 / 3-4), ponte retificadora em losango (1, 2, 3+, 4−) e disjuntor com quadrado preto (o "x" da IEC continua como opção).
- Motor de 6 terminais com borne de terra (PE) e ponte retificadora com saída sem filtro, com capacitor ou ideal (Vcc = Vca).
- **Redimensionar:** selecione uma parte do circuito e arraste um dos quadradinhos nos cantos da seleção para diminuir ou aumentar (os fios continuam ligados). No painel há 50%, 75%, 100% e **Caber na folha**; em **Documentação → Encaixar o esquema na folha** a folha inteira é ajustada de uma vez.
- Seleção por retângulo, copiar/colar/duplicar, desfazer/refazer, ajuste do trajeto dos fios e desvio automático.
- Ligações confiáveis: o clique "puxa" para o terminal mais próximo, terminar um fio sobre outro cria o ponto de conexão, e um indicador verde mostra onde o fio vai ligar.
- Cores dos fios e **Colorir fios pela norma** (IEC 60445).
- **Nome arrastável:** clique e arraste o nome (tag) de qualquer componente para tirá-lo de cima do desenho; o botão "Voltar o nome para o lugar padrão" desfaz.
- Portas lógicas com o símbolo simples (formato das portas) ou retangular (IEC), e de 2 a 8 entradas.
- Curvas de fio invisíveis, como no CADe_SIMU: a bolinha só aparece nas junções (3 fios ou mais) e nos terminais. Um fio desenhado por cima de outro se liga sozinho, e cancelar um fio (botão direito ou Esc) apaga o trecho que ficou solto.

**Simulação**
- Análise nodal em CC e CA 60 Hz, com fases defasadas.
- Bobina abaixo de 80% não atraca, lâmpada em sobretensão queima, fusível e disjuntor desarmam por sobrecarga e curto (curvas B, C, D), relé térmico pela corrente real do motor, DR por fuga, transistores e capacitores.
- Diagnóstico ao vivo ("O que faz", "Problemas", "Eventos"), com correções em um clique.
- Osciloscópio de 2 canais e gráfico ao longo do tempo.
- Treino de defeitos (modo professor e aluno) com multímetro de pontas.

**Circuitos integrados e sensores**
- CIs com a pinagem real, no formato DIP: portas 74HC00, 02, 04, 08, 14 (Schmitt), 32 e 86; CMOS CD4011, 4069, 4071, 4081 e 4070; flip-flops 74HC74 e CD4013; 74HC138 (decodificador), 74HC151 (multiplexador), 74HC161 (contador), **74HC595** (registrador de deslocamento), CD4017 (contador de década), CD4511 (BCD para 7 segmentos), **NE555** (temporizador), ULN2003, L293D (ponte H), LM393 (comparador) e PC817 (optoacoplador).
- Os pinos acendem em verde quando estão em nível alto. O CI precisa de VCC e GND e queima se passar da tensão máxima (74HC: 6 V; CD4000: 18 V; NE555: 16 V).
- Display de 7 segmentos (cátodo ou ânodo comum), reguladores 7805, 7809, 7812 e AMS1117, sensor de temperatura LM35 e LDR (clique para mudar a temperatura ou a luz).
- Modelos prontos **Pisca-pisca com NE555** e **Registrador 74HC595 com 8 LEDs** e **Onda de LEDs (NE555 + 74HC595)** (também no arquivo `Onda-de-LEDs.fais`).

**CLP**
- Entradas e saídas digitais e **analógicas** (0–10 V = 0–27648, como na Siemens): IW64, IW66… e QW64, QW66… nas CPUs, ET 200 e nos módulos de entrada/saída analógica; A0–A5 (0–1023) no Arduino.
- Ladder com contatos, bobinas (normal, negada, Set, Reset), TON/TOF, **CTU, CTD e CTUD**, **comparadores** (==, <>, >=, <=, >, <), **IN_RANGE / OUT_RANGE** e **MOVE**. Os valores podem ser variáveis (IW64, QW64, MW…, C1.CV, T1.ET) ou números.
- Modelo pronto **CLP com entrada e saída analógica** (potenciômetro em IW64, comparador, MOVE para QW64 e voltímetro).

**Documentação**
- Várias folhas, ligação entre folhas, moldura com colunas e carimbo, numeração de fios, referência cruzada, lista de materiais (tela, CSV, PDF) e PDF vetorial.

**Configurações** (engrenagem)
- Português ou inglês, tema claro/escuro, e o que aparece no desenho (valores, medições, números dos terminais, referência cruzada, grade, selos).
- Setas nas bordas escondem a paleta, o painel lateral e a barra (`Ctrl+Shift+F` faz tudo de uma vez).

## Atalhos

| Tecla | Ação |
|---|---|
| `R` | Gira |
| `Del` | Exclui |
| `Ctrl+A` / `Ctrl+C` / `Ctrl+V` / `Ctrl+D` | Selecionar tudo / copiar / colar / duplicar |
| `Ctrl+Z` / `Ctrl+Y` | Desfazer / refazer |
| `Ctrl+S` / `Ctrl+O` | Salvar / abrir .fais |
| `Esc` | Cancela |
| `Ctrl+Shift+F` | Esconde/mostra paleta, painel e barra |

## Limitações conhecidas

- Motores sem corrente de partida; bobinas sem indutância; retificador sem ondulação.
- A simulação anda em passos de 0,1 s: o NE555 funciona bem até uns 2 Hz, e os CIs são lógicos (sem atraso de propagação).
- Uma CPU de CLP por projeto.
- Os projetos ficam no navegador: salve em `.fais` para não perder.

## Licença

MIT © 2026 Thiagosystems
