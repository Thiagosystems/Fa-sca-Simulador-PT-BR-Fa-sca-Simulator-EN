# ⚡ Faísca

**Simulador de comandos elétricos, eletrônica, CLP e pneumática que roda no navegador.**
Feito por **Thiagosystems**. 🇺🇸 [Read in English](README.md)

O Faísca é uma versão moderna de ferramentas como o CADe_SIMU e o Proteus: você desenha o circuito com símbolos IEC, aperta **Simular** e vê o que acontece de verdade — tensões e correntes reais, motor girando, fusível queimando, LED queimando quando falta o resistor — enquanto o **painel de diagnóstico** explica o que o circuito está fazendo e o que pode dar errado.

É um único arquivo HTML: não precisa instalar, nem de servidor, nem de conta. Funciona sem internet.

---

## O que ele faz

**Desenho**
- 197 itens na paleta (91 tipos de componente) em 18 bibliotecas: alimentação, fusíveis e seccionadores, DR e disjuntores (símbolo simplificado ou detalhado, com disparador térmico e magnético), contatores, motores (monofásico, trifásico, estrela-triângulo, Dahlander, CC), soft-starter e inversor, temporizadores e relés, botoeiras (impulso, retenção, dupla NA+NF, comutadora, luminosa, de puxar, pedal, emergência) e fins de curso, sensores, sinalização, portas lógicas, CLPs (genérico, S7-1200, S7-1500, ET 200, Arduino), ladder, GRAFCET, pneumática, cabos e bornes, eletrônica (resistor, potenciômetro, capacitor, LED, diodo, transistores NPN/PNP, MOSFET) e instrumentos.
- Seleção por retângulo, seleção múltipla, copiar/colar/duplicar, desfazer/refazer, ajuste do trajeto dos fios e desvio automático de componentes.
- Ligações como no CADe_SIMU: o clique "puxa" para o terminal mais próximo, terminar um fio em cima de outro fio cria o ponto de conexão de verdade, terminais encostados ficam ligados, e um indicador verde mostra onde o fio vai ligar.
- Cor de cada fio (preto, marrom, cinza, azul-claro, verde-amarelo, vermelho, azul-escuro e outras) e **Colorir fios pela norma** (IEC 60445: L1 marrom, L2 preto, L3 cinza, N azul-claro, PE verde-amarelo).
- O diagnóstico acha pontos que parecem ligados mas estão soltos e corrige com um clique.

**Simulação com valores reais**
- Análise nodal em corrente contínua e alternada 60 Hz (fases defasadas em 120°). Valores editáveis: resistência, tensão, potência, corrente nominal, capacitância, β, Vth… inclusive durante a simulação.
- Comportamento de vida real: bobina com tensão baixa não atraca, lâmpada com sobretensão queima, fusível e disjuntor desarmam por sobrecarga (térmico) ou curto (magnético, curvas B/C/D), relé térmico atua pela corrente real do motor, DR desarma por fuga para a terra, capacitor carrega pela curva RC.
- Osciloscópio de 2 canais isolados e gráficos de tensão e corrente ao longo do tempo.

**Ensino**
- Painel de diagnóstico: o que o circuito está fazendo, problemas encontrados (falta de proteção, contato sem bobina, falta de intertravamento, tensão errada…) e histórico de eventos.
- Treino de defeitos: o professor esconde defeitos (componente interrompido, contato colado, curto interno, fio rompido); o aluno mede com o multímetro de pontas e acusa onde está o defeito. Senha opcional e contagem de acertos.
- Tutorial guiado na primeira vez que o programa é aberto (e depois em **Arquivo → Tutorial guiado**).

**Documentação profissional**
- Várias **folhas** por projeto (força, comando, CLP…) com **ligação entre folhas**. Recortar e colar entre folhas mantém os nomes (K1 continua K1), e ao excluir uma folha dá para **juntar** tudo em outra folha. Folhas vazias não entram no PDF.
- **Moldura** com numeração de colunas e **carimbo** (título, cliente, desenhista, número do desenho, revisão, data).
- **Numeração automática de fios** por potencial (L1, L2, L3, N, PE, L+, M e números sequenciais).
- **Referência cruzada**: cada contato mostra a folha/coluna da sua bobina, e cada bobina mostra o espelho de contatos (`13-14 /2.3`).
- **Lista de materiais** gerada do esquema (na tela, em planilha CSV e no PDF).
- **PDF vetorial** em A3 com todas as folhas, carimbo e lista de materiais — o texto é de verdade: dá para selecionar e buscar.
- **Renumerar bornes** da esquerda para a direita, de X1 em diante.

**Configurações** (botão de engrenagem)
- Idioma: português ou inglês.
- Tema claro, escuro ou automático.
- Escolher o que aparece no desenho: valores nominais, medições ao vivo, números dos terminais, referência cruzada, numeração dos fios, moldura, grade e selos de problema — para deixar o desenho limpo como no CADe_SIMU.
- Som e animações.

**Arquivos**
- Projetos salvos automaticamente no navegador; arquivos `.fais` para backup e para enviar a outras pessoas; exportação em PDF.

---

## Baixar e usar

1. Baixe o ZIP e descompacte.
2. Dê dois cliques em **`index.html`**. Abre no Chrome, Edge ou Firefox.

Pronto. Tudo roda no seu computador; só a fonte das letras vem da internet (sem internet ele usa uma fonte parecida do sistema).

## Instalar como aplicativo (PWA)

Os navegadores só deixam instalar aplicativos web que estejam num endereço **https** (ou em `localhost`). Abrir o `index.html` com dois cliques funciona, mas não mostra a opção *Instalar*. Para ter o ícone na área de trabalho e no celular, abrindo sem internet:

**Opção A — GitHub Pages (grátis)**
1. Crie um repositório no GitHub e envie todos os arquivos desta pasta (`index.html`, `manifest.webmanifest`, `sw.js`, `icons/`, …).
2. No repositório: **Settings → Pages → Branch: `main` / pasta raiz → Save**.
3. Abra o endereço que o GitHub mostrar (ex.: `https://seu-usuario.github.io/faisca/`).
4. No Chrome/Edge: **menu → Instalar aplicativo**, ou o ícone de instalar na barra de endereço. No Android: *Adicionar à tela inicial*. No iPhone (Safari): *Compartilhar → Adicionar à Tela de Início*. O Faísca também mostra **Arquivo → Instalar aplicativo** quando o navegador permite.

**Opção B — no seu próprio computador**
```bash
cd Faisca
python3 -m http.server 8000
# abra http://localhost:8000 e instale pelo menu do navegador
```

Depois de instalado, o Faísca abre na própria janela e funciona sem internet.

## Primeiros passos

1. **Modelos prontos** → *Partida direta* → **Simular** → clique e segure **S1**.
2. Selecione um componente para ver e mudar os valores no painel da direita.
3. **Documentação** → ligue *Numerar fios*, preencha o *Carimbo do projeto* e veja a *Lista de materiais*.
4. **Arquivo → Exportar PDF** para gerar o documento com todas as folhas.

## Atalhos

| Tecla | Ação |
|---|---|
| Clique esquerdo | Colocar componentes, ligar fios, selecionar, mover |
| Clique direito | Cancela o fio; arrastado, move a vista |
| Arrastar no vazio | Seleção por retângulo |
| `Shift`/`Ctrl` + clique | Adiciona ou tira da seleção |
| `Del` | Exclui a seleção |
| `Ctrl+A` / `Ctrl+C` / `Ctrl+X` / `Ctrl+V` / `Ctrl+D` | Selecionar tudo / copiar / recortar / colar / duplicar |
| `Ctrl+Z` / `Ctrl+Y` | Desfazer / refazer |
| `Ctrl+S` / `Ctrl+O` | Salvar / abrir `.fais` |
| `R` | Girar |
| `Ctrl+PageDown` / `Ctrl+PageUp` | Próxima / folha anterior |
| `Shift` + clique numa botoeira (simulando) | Deixa ela segurada |
| `M` (no treino, simulando) | Liga/desliga o multímetro de pontas |
| `Esc` | Cancela |
| `Ctrl+Shift+F` | Esconde/mostra paleta, painel e barra de uma vez (as setas nas bordas do desenho fazem o mesmo, uma por uma) |

## Valores dos componentes

- Aceita escrita técnica: `220`, `4k7` (4,7 kΩ), `2,2k`, `10m` (mili), `470u` (micro), `1M` (mega).
- Padrões: rede 220/380 V, bobina de contator 220 V, relé e solenoide 24 V, motor trifásico 380 V. Ajuste conforme o seu painel.
- Componente queimado: clique nele durante a simulação para trocar por um novo.

## Arquivos desta pasta

| Arquivo | O que é |
|---|---|
| `index.html` | O programa inteiro |
| `manifest.webmanifest`, `sw.js`, `icons/` | Usados só para instalar como aplicativo e abrir sem internet quando hospedado |
| `README.md`, `README.pt-BR.md` | Esta documentação |
| `LICENSE` | Licença MIT |

## Limitações conhecidas

- Os motores são calculados como cargas resistivas equivalentes (ainda sem corrente de partida).
- As bobinas não têm indutância: o pico de tensão ao desligar um relé não é simulado.
- O retificador é um bloco que entrega a tensão média ou de pico (sem ondulação no osciloscópio).
- Só uma CPU de CLP por projeto.
- A senha do treino evita espiar por descuido, mas quem abrir o `.fais` num editor de texto consegue ler os defeitos.

## Licença

[MIT](LICENSE) © 2026 Thiagosystems. Pode usar, copiar, modificar e distribuir, inclusive comercialmente, mantendo o aviso de copyright.
