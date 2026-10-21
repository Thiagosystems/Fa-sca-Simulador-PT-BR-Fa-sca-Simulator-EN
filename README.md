# Faísca — electrical control simulator

Made by **Thiagosystems**. An electrical control, electronics, PLC and pneumatics simulator that runs in the browser, calculates real voltages and currents, and works as an installable app (offline too).

[Versão em português](README.pt-BR.md)

## Getting started

- **Open:** open `index.html` in a browser, or publish the folder on an https site (GitHub Pages, Netlify, Vercel) to install it as an app.
- **Install:** in Chrome or Edge, use the install icon in the address bar or **File → Install app**. On Android, menu **⋮ → Install app**; on iPhone, **Share → Add to Home Screen**.
- **Example:** `Estrela-triangulo-24Vcc.fais` opens via **File → Open .fais file**. The same circuit is in **Ready-made examples → Star-delta starter with 24 V DC control**.

## Features

**Drawing**
- More than 230 items in 19 libraries: supplies, fuses and disconnectors, RCDs and circuit breakers (simplified or detailed symbol), contactors, motors, starting and speed control, contacts and timers, push buttons (momentary, latching, double NO+NC, changeover, illuminated, pull, foot pedal, emergency), detectors, signalling, electronic relays, logic, PLC, Ladder, GRAFCET, pneumatics, cables, electronics and integrated circuits.
- **Editable contact numbering** (e.g. 53-54, 61-62, 83-84), like CADe_SIMU.
- CADe_SIMU-style symbols: transformer with core (1-2 / 3-4), diamond bridge rectifier (1, 2, 3+, 4−) and circuit breaker with a black square (the IEC "x" is still an option).
- 6-terminal motor with an earth (PE) terminal, and a bridge rectifier with unfiltered, capacitor-filtered or ideal (Vdc = Vac) output.
- **Resize:** select part of the circuit and drag one of the small squares at the corners of the selection to shrink or enlarge it (wires stay connected). The panel offers 50%, 75%, 100% and **Fit to sheet**; **Documentation → Fit the schematic to the sheet** adjusts the whole sheet at once.
- Box selection, copy/paste/duplicate, undo/redo, wire re-routing and automatic obstacle avoidance.
- Reliable wiring: clicks snap to the nearest terminal, ending a wire on another wire creates a junction, and a green marker shows where the wire will connect.
- Per-wire colours and **Colour wires by standard** (IEC 60445).
- Invisible wire bends, like CADe_SIMU: dots only appear at junctions (3 or more wires) and terminals. A wire drawn over another one connects automatically, and cancelling a wire (right click or Esc) removes the loose part.

**Simulation**
- Nodal analysis in DC and 60 Hz AC with phase-shifted lines.
- Coils below 80% do not pull in, over-voltage burns lamps, fuses and breakers trip on overload and short circuit (B, C, D curves), overload relays follow the real motor current, RCDs trip on leakage, transistors and capacitors.
- Live diagnostics ("What it does", "Problems", "Events") with one-click fixes.
- 2-channel oscilloscope and history chart.
- Fault training (teacher and student modes) with a probe multimeter.

**Integrated circuits and sensors**
- ICs with real DIP pinouts: 74HC00, 02, 04, 08, 14 (Schmitt), 32 and 86 gates; CMOS CD4011, 4069, 4071, 4081 and 4070; 74HC74 and CD4013 flip-flops; 74HC138 (decoder), 74HC151 (multiplexer), 74HC161 (counter), **74HC595** (shift register), CD4017 (decade counter), CD4511 (BCD to 7-segment), **NE555** (timer), ULN2003, L293D (H-bridge), LM393 (comparator) and PC817 (optocoupler).
- Pins light up green when they are high. Each IC needs VCC and GND, and burns out above its maximum supply (74HC: 6 V; CD4000: 18 V; NE555: 16 V).
- 7-segment display (common cathode or anode), 7805, 7809, 7812 and AMS1117 regulators, LM35 temperature sensor and LDR (click to change the temperature or the light).
- Ready-made examples **NE555 LED flasher** and **74HC595 shift register with 8 LEDs**.

**PLC**
- Digital and **analog** inputs and outputs (0–10 V = 0–27648, Siemens style): IW64, IW66… and QW64, QW66… on CPUs, ET 200 and analog I/O modules; A0–A5 (0–1023) on Arduino.
- Ladder with contacts, coils (normal, negated, Set, Reset), TON/TOF, **CTU, CTD and CTUD**, **comparators** (==, <>, >=, <=, >, <), **IN_RANGE / OUT_RANGE** and **MOVE**. Values can be variables (IW64, QW64, MW…, C1.CV, T1.ET) or numbers.
- Ready-made example **PLC with analog input and output** (potentiometer on IW64, comparator, MOVE to QW64 and a voltmeter).

**Documentation**
- Multiple sheets, inter-sheet links, frame with columns and title block, wire numbers, cross-references, bill of materials (screen, CSV, PDF) and vector PDF.

**Settings** (gear button)
- Portuguese or English, light/dark theme, and what is shown on the drawing (values, measurements, terminal numbers, cross-references, grid, badges).
- Arrows on the drawing edges hide the palette, side panel and toolbar (`Ctrl+Shift+F` toggles all of them).

## Shortcuts

| Key | Action |
|---|---|
| `R` | Rotate |
| `Del` | Delete |
| `Ctrl+A` / `Ctrl+C` / `Ctrl+V` / `Ctrl+D` | Select all / copy / paste / duplicate |
| `Ctrl+Z` / `Ctrl+Y` | Undo / redo |
| `Ctrl+S` / `Ctrl+O` | Save / open .fais |
| `Esc` | Cancel |
| `Ctrl+Shift+F` | Hide/show palette, side panel and toolbar |

## Known limitations

- No motor inrush current; coils have no inductance; the rectifier has no ripple.
- The simulation runs in 0.1 s steps: the NE555 works well up to about 2 Hz, and ICs are logic-level models (no propagation delay).
- One PLC CPU per project.
- Projects are stored in the browser: save them as `.fais` so you don't lose them.

## License

MIT © 2026 Thiagosystems
