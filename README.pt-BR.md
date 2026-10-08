# Faísca — simulador de comandos elétricos

Feito por **Thiagosystems**. Simulador de comandos elétricos, eletrônica, CLP e pneumática que roda no navegador, calcula tensões e correntes reais e funciona como aplicativo instalável (também sem internet).

[English version](README.md)

## Como usar

- **Abrir:** abra o `index.html` no navegador, ou publique a pasta num site com https (GitHub Pages, Netlify, Vercel) para poder instalar como aplicativo.
- **Instalar:** no Chrome ou Edge, use o ícone de instalar na barra de endereço ou **Arquivo → Instalar aplicativo**. No Android, menu **⋮ → Instalar aplicativo**; no iPhone, **Compartilhar → Adicionar à Tela de Início**.
- **Exemplo pronto:** `Estrela-triangulo-24Vcc.fais` abre em **Arquivo → Abrir arquivo .fais**. O mesmo circuito está em **Modelos prontos → Estrela-triângulo com comando 24 Vcc**.

## Recursos

**Desenho**
- Quase 200 itens em 18 bibliotecas: alimentação, fusíveis e seccionadores, DR e disjuntores (símbolo simplificado ou detalhado), contatores, motores, partida e velocidade, contatos e temporizadores, botoeiras (impulso, retenção, dupla NA+NF, comutadora, luminosa, de puxar, pedal, emergência), detectores, sinalização, relés eletrônicos, lógica, CLP, Ladder, GRAFCET, pneumática, cabos e eletrônica.
- **Numeração editável dos contatos** (ex.: 53-54, 61-62, 83-84), como no CADe_SIMU.
- Símbolos no estilo do CADe_SIMU: transformador com núcleo (1-2 / 3-4), ponte retificadora em losango (1, 2, 3+, 4−) e disjuntor com quadrado preto (o "x" da IEC continua como opção).
- Motor de 6 terminais com borne de terra (PE) e ponte retificadora com saída sem filtro, com capacitor ou ideal (Vcc = Vca).
- **Redimensionar:** selecione uma parte do circuito e arraste um dos quadradinhos nos cantos da seleção para diminuir ou aumentar (os fios continuam ligados). No painel há 50%, 75%, 100% e **Caber na folha**; em **Documentação → Encaixar o esquema na folha** a folha inteira é ajustada de uma vez.
- Seleção por retângulo, copiar/colar/duplicar, desfazer/refazer, ajuste do trajeto dos fios e desvio automático.
- Ligações confiáveis: o clique "puxa" para o terminal mais próximo, terminar um fio sobre outro cria o ponto de conexão, e um indicador verde mostra onde o fio vai ligar.
- Cores dos fios e **Colorir fios pela norma** (IEC 60445).
- Curvas de fio invisíveis, como no CADe_SIMU: a bolinha só aparece nas junções (3 fios ou mais) e nos terminais. Um fio desenhado por cima de outro se liga sozinho, e cancelar um fio (botão direito ou Esc) apaga o trecho que ficou solto.

**Simulação**
- Análise nodal em CC e CA 60 Hz, com fases defasadas.
- Bobina abaixo de 80% não atraca, lâmpada em sobretensão queima, fusível e disjuntor desarmam por sobrecarga e curto (curvas B, C, D), relé térmico pela corrente real do motor, DR por fuga, transistores e capacitores.
- Diagnóstico ao vivo ("O que faz", "Problemas", "Eventos"), com correções em um clique.
- Osciloscópio de 2 canais e gráfico ao longo do tempo.
- Treino de defeitos (modo professor e aluno) com multímetro de pontas.

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
- Uma CPU de CLP por projeto.
- Os projetos ficam no navegador: salve em `.fais` para não perder.

## Licença

MIT © 2026 Thiagosystems
