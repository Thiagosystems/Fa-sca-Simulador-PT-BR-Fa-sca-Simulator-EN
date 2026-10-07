# Faísca — electrical control simulator

Made by **Thiagosystems**. An electrical control, electronics, PLC and pneumatics simulator that runs in the browser, calculates real voltages and currents, and works as an installable app (offline too).

[Versão em português](README.pt-BR.md)

## Getting started

- **Open:** open `index.html` in a browser, or publish the folder on an https site (GitHub Pages, Netlify, Vercel) to install it as an app.
- **Install:** in Chrome or Edge, use the install icon in the address bar or **File → Install app**. On Android, menu **⋮ → Install app**; on iPhone, **Share → Add to Home Screen**.
- **Example:** `Estrela-triangulo-24Vcc.fais` opens via **File → Open .fais file**. The same circuit is in **Ready-made examples → Star-delta starter with 24 V DC control**.

## Features

**Drawing**
- Nearly 200 items in 18 libraries: supplies, fuses and disconnectors, RCDs and circuit breakers (simplified or detailed symbol), contactors, motors, starting and speed control, contacts and timers, push buttons (momentary, latching, double NO+NC, changeover, illuminated, pull, foot pedal, emergency), detectors, signalling, electronic relays, logic, PLC, Ladder, GRAFCET, pneumatics, cables and electronics.
- **Editable contact numbering** (e.g. 53-54, 61-62, 83-84), like CADe_SIMU.
- CADe_SIMU-style symbols: transformer with core (1-2 / 3-4), diamond bridge rectifier (1, 2, 3+, 4−) and circuit breaker with a black square (the IEC "x" is still an option).
- 6-terminal motor with an earth (PE) terminal, and a bridge rectifier with unfiltered, capacitor-filtered or ideal (Vdc = Vac) output.
- **Resize:** select part of the circuit and drag one of the small squares at the corners of the selection to shrink or enlarge it (wires stay connected). The panel offers 50%, 75%, 100% and **Fit to sheet**; **Documentation → Fit the schematic to the sheet** adjusts the whole sheet at once.
- Box selection, copy/paste/duplicate, undo/redo, wire re-routing and automatic obstacle avoidance.
- Reliable wiring: clicks snap to the nearest terminal, ending a wire on another wire creates a junction, and a green marker shows where the wire will connect.
- Per-wire colours and **Colour wires by standard** (IEC 60445).

**Simulation**
- Nodal analysis in DC and 60 Hz AC with phase-shifted lines.
- Coils below 80% do not pull in, over-voltage burns lamps, fuses and breakers trip on overload and short circuit (B, C, D curves), overload relays follow the real motor current, RCDs trip on leakage, transistors and capacitors.
- Live diagnostics ("What it does", "Problems", "Events") with one-click fixes.
- 2-channel oscilloscope and history chart.
- Fault training (teacher and student modes) with a probe multimeter.

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
- One PLC CPU per project.
- Projects are stored in the browser: save them as `.fais` so you don't lose them.

## License

MIT © 2026 Thiagosystems
